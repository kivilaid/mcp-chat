import { auth } from "@/app/(auth)/auth"
import { systemPrompt } from "@/lib/ai/prompts"
import { myProvider } from "@/lib/ai/providers"
import { isProductionEnvironment, isAuthDisabled } from "@/lib/constants"
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from "@/lib/db/queries"
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from "@/lib/utils"
import { getEffectiveSession, shouldPersistData } from "@/lib/auth-utils"
import { MCPSessionManager } from "@/mods/mcp-client"
import {
  UIMessage,
  smoothStream,
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  stepCountIs,
  streamText,
} from "ai"
import { generateTitleFromUserMessage } from "../../actions"
import { ChatSDKError } from "@/lib/errors"
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream'
import { after } from 'next/server'

export const maxDuration = 60

const MCP_BASE_URL = process.env.MCP_SERVER ? process.env.MCP_SERVER : "https://remote.mcp.pipedream.net"

let globalStreamContext: ResumableStreamContext | null = null

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      })
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        )
      } else {
        console.error(error)
      }
    }
  }

  return globalStreamContext
}


export async function POST(request: Request) {
  try {
    const requestBody = await request.json()
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string
      messages: Array<UIMessage>
      selectedChatModel: string
    } = requestBody

    const session = await getEffectiveSession()

    // Debug logging for production
    console.log('DEBUG: Session details:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionType: session?.constructor?.name || 'unknown',
      isAuthDisabled: process.env.DISABLE_AUTH === 'true',
      timestamp: new Date().toISOString()
    })

    if (!session || !session.user || !session.user.id) {
      console.error('Session validation failed:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        fullSession: session
      })
      return new ChatSDKError('unauthorized:chat').toResponse()
    }

    const userId = session.user.id

    const userMessage = getMostRecentUserMessage(messages)

    if (!userMessage) {
      return new ChatSDKError('bad_request:api').toResponse()
    }

    // Only check/save chat and messages if persistence is enabled
    if (shouldPersistData()) {
      const chat = await getChatById({ id })

      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        })

        await saveChat({ id, userId, title })
      } else {
        if (chat.userId !== userId) {
          return new Response("Unauthorized", { status: 401 })
        }
      }

      await saveMessages({
        messages: [
          {
            chatId: id,
            id: userMessage.id,
            role: "user",
            parts: userMessage.parts,
            attachments: userMessage.experimental_attachments ?? [],
            createdAt: new Date(),
          },
        ],
      })
    }

    // get any existing mcp sessions from the mcp server
    const mcpSessionUrl = `${MCP_BASE_URL}/v1/${userId}/sessions`
    console.log('DEBUG: Fetching MCP sessions from:', mcpSessionUrl)
    console.log('DEBUG: Looking for chat ID:', id)
    
    const mcpSessionsResp = await fetch(mcpSessionUrl)
    let sessionId = undefined
    
    console.log('DEBUG: MCP sessions response:', {
      ok: mcpSessionsResp.ok,
      status: mcpSessionsResp.status,
      statusText: mcpSessionsResp.statusText,
      headers: Object.fromEntries(mcpSessionsResp.headers.entries())
    })
    
    if (mcpSessionsResp.ok) {
      const body = await mcpSessionsResp.json()
      console.log('DEBUG: MCP sessions body:', body)
      console.log('DEBUG: Looking for body[id]:', body[id])
      console.log('DEBUG: Looking for body.mcpSessions[id]:', body.mcpSessions ? body.mcpSessions[id] : 'mcpSessions not found')
      
      // Try both formats to see which one works
      if (body.mcpSessions && body.mcpSessions[id]) {
        sessionId = body.mcpSessions[id]
        console.log('DEBUG: Found sessionId in body.mcpSessions[id]:', sessionId)
      } else if (body[id]) {
        sessionId = body[id]
        console.log('DEBUG: Found sessionId in body[id]:', sessionId)
      }
    } else {
      console.error('DEBUG: MCP sessions fetch failed:', await mcpSessionsResp.text())
    }

    console.log('DEBUG: Final sessionId for MCPSessionManager:', sessionId)
    const mcpSession = new MCPSessionManager(MCP_BASE_URL, userId, id, sessionId)

    const system = systemPrompt({ selectedChatModel })

    // Configure provider options for GPT models
    const isGPT5Model = selectedChatModel.startsWith('gpt-5')
    const isOpenAIModel = selectedChatModel.startsWith('gpt-')
    // Get tools with validation
    const tools = await mcpSession.tools({ useCache: false })

    const streamOptions: any = {
      model: myProvider.languageModel(selectedChatModel),
      system,
      messages: convertToModelMessages(messages),
      maxSteps: 20,
      experimental_transform: smoothStream({ chunking: "word" }),
      experimental_generateMessageId: generateUUID,
      tools,
      experimental_telemetry: {
        isEnabled: isProductionEnvironment,
        functionId: "stream-text",
      },
    }

    // Add provider options for OpenAI models
    if (isOpenAIModel) {
      streamOptions.providerOptions = {
        openai: {
          temperature: 1, // Ensure temperature is explicitly set to 1 for all OpenAI models
          ...(isGPT5Model && { reasoningEffort: "medium" }), // Only add reasoningEffort for GPT-5
        }
      }
    }

    const streamId = generateUUID()

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system,
          messages: convertToModelMessages(messages),
          maxSteps: 20,
          experimental_transform: smoothStream({ chunking: "word" }),
          experimental_generateMessageId: generateUUID,
          tools,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          ...streamOptions,
          onFinish: async ({ usage }) => {
            if (userId && shouldPersistData()) {
              try {
                // Usage tracking could be added here if needed
                dataStream.write({ type: 'data-usage', data: usage })
              } catch (error) {
                console.error("Failed to write usage data")
              }
            }
          },
        })

        result.consumeStream()

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        )
      },
      generateId: generateUUID,
      onFinish: async ({ messages: streamMessages }) => {
        if (userId && shouldPersistData()) {
          try {
            const assistantMessages = streamMessages.filter(
              (message) => message.role === "assistant"
            )

            if (assistantMessages.length > 0) {
              await saveMessages({
                messages: assistantMessages.map((message) => ({
                  id: message.id,
                  chatId: id,
                  role: message.role,
                  parts: message.parts,
                  attachments: [],
                  createdAt: new Date(),
                })),
              })
            }
          } catch (error) {
            console.error("Failed to save chat", error)
          }
        }
      },
      onError: () => {
        return "Oops, an error occurred!"
      },
    })

    const streamContext = getStreamContext()

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream())
        )
      )
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()))
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        'AI Gateway requires a valid credit card on file to service requests',
      )
    ) {
      return new ChatSDKError('bad_request:activate_gateway').toResponse()
    }

    console.error('Unhandled error in chat API:', error)
    return new ChatSDKError('offline:chat').toResponse()
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse()
  }

  const session = await getEffectiveSession()

  if (!session || !session.user) {
    return new ChatSDKError('unauthorized:chat').toResponse()
  }
  
  const userId = session.user.id

  // In dev mode without auth, just return success without deleting
  if (!shouldPersistData()) {
    return new Response("Chat deleted", { status: 200 })
  }

  try {
    const chat = await getChatById({ id })

    if (chat.userId !== userId) {
      return new ChatSDKError('forbidden:chat').toResponse()
    }

    await deleteChatById({ id })

    return new Response("Chat deleted", { status: 200 })
  } catch (error) {
    console.error('Error in DELETE chat API:', error)
    return new ChatSDKError('offline:chat').toResponse()
  }
}
