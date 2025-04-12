export const AI_CONFIG = {
  openai: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  },
  gemini: {
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  },
  anthropic: {
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
  }
}; 