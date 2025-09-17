export const DEFAULT_CHAT_MODEL: string = 'claude-4-sonnet';
export const FAQ_MODEL: string = 'gpt-4o-mini'; // Model used for FAQ-heavy queries - faster than GPT-5 Mini

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  openrouterModel?: string; // OpenRouter model ID for N8N mapping
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    description: 'Latest and most capable Claude model',
    openrouterModel: 'anthropic/claude-sonnet-4',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Best balance of intelligence and speed',
    openrouterModel: 'anthropic/claude-3.5-sonnet',
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    description: 'Latest OpenAI mini model with improved capabilities',
    openrouterModel: 'openai/gpt-5-mini',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and cost-effective OpenAI model',
    openrouterModel: 'openai/gpt-4o-mini',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: "Google's fast multimodal model",
    openrouterModel: 'google/gemini-2.5-flash-preview',
  },
  // Keep the old one for backwards compatibility
  {
    id: 'chat-model',
    name: 'Default Chat Model',
    description: 'Legacy default model',
    openrouterModel: 'anthropic/claude-3.5-sonnet',
  },
];
