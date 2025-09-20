export const DEFAULT_CHAT_MODEL: string = "claude-sonnet-4-0"

interface ChatModel {
  id: string
  name: string
  description: string
}

export const chatModels: Array<ChatModel> = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "High performance, low cost model",
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    description: "Flagship GPT-5 model for complex tasks",
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Compact GPT-5 for fast, efficient tasks",
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    description: "Ultra-fast GPT-5 for lightweight operations",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Small model for fast, lightweight tasks",
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    description: "Flagship model for complex tasks",
  },
  {
    id: "claude-opus-4-0",
    name: "Claude Opus 4",
    description: "Highest level of intelligence and capability",
  },
  {
    id: "claude-sonnet-4-0",
    name: "Claude Sonnet 4",
    description: "High intelligence and balanced performance",
  },
  // {
  //   id: 'chat-model-reasoning',
  //   name: 'Reasoning model',
  //   description: 'Uses advanced reasoning',
  // },
]
