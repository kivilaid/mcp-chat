import type {
  CoreAssistantMessage,
  CoreToolMessage,
  Message,
  TextStreamPart,
  ToolInvocation,
  ToolSet,
  UIMessage,
} from 'ai';
import type { ChatMessage } from '@/lib/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { DBMessage, Document } from '@/lib/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getGuestUserId(): string {
  // Use EXTERNAL_USER_ID from env (for development)
  return process.env.EXTERNAL_USER_ID || 'local-dev-user';
}

export function createGuestSession() {
  return {
    user: {
      id: getGuestUserId(),
      name: 'Guest User',
      email: 'guest@example.com'
    }
  };
}


function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

const thinkingPhrases = [
  'Thinking',
  'Processing bits',
  'Noodling',
  'Pondering',
  'Processing',
  'The robots are thinking',
  'Computing',
  'Mulling it over',
  'Contemplating',
  'Brain churning',
  'Neurons firing',
  'Cogitating',
  'Mind melding',
  'Synapses firing',
  'Ruminating',
  'Deliberating',
  'Brainstorming',
  'Connecting dots',
  'Crunching thoughts',
  'Performing mental gymnastics',
  'Ideating',
  'Beep boop',
];

// Simple hash function to get consistent index from string
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function prettifyToolName(name: string, seed?: string) {
  const normalized = name.replace(/[\s_-]+/g, '').toUpperCase();
  const specialTools: Record<string, string | ((seed?: string) => string)> = {
    WEBSEARCH: 'Searching the web',
    WHATAREYOUTRYINGTODO: (seed) => {
      const hash = simpleHash(seed || name);
      return thinkingPhrases[hash % thinkingPhrases.length];
    },
    SELECTAPPS: 'Selecting tools',
  };
  if (specialTools[normalized]) {
    const result = specialTools[normalized];
    return typeof result === 'function' ? result(seed) : result;
  }
  // Else handle component tools with separators like _ or - or spaces.
  const words = name.split(/[\s_-]+/);
  const capitalizedWords = words.map((word) =>
    word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word,
  );
  return capitalizedWords.join(' ');
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}