import { AIModel, CustomInstructions } from '@/types/ai-models';
import { Goal, UserGoal, UserTask } from '@/types/supabase';

interface AIContext {
  userGoals?: (Goal | UserGoal)[];
  userTasks?: UserTask[];
  customInstructions?: CustomInstructions;
}

export class AIService {
  private model: AIModel;
  private context: AIContext;

  constructor(model: AIModel, context: AIContext = {}) {
    this.model = model;
    this.context = context;
  }

  private async callAPI(messages: any[], customApiKey?: string) {
    const apiKey = customApiKey || this.model.apiKey;
    if (!apiKey) {
      throw new Error('No API key provided');
    }

    try {
      switch (this.model.id) {
        case 'gpt-3.5-turbo':
          return await this.callOpenAI(messages, apiKey);
        case 'gemini-pro':
          return await this.callGemini(messages, apiKey);
        case 'claude-2':
          return await this.callClaude(messages, apiKey);
        default:
          throw new Error('Unsupported model');
      }
    } catch (error) {
      console.error('AI API call failed:', error);
      throw error;
    }
  }

  private async callOpenAI(messages: any[], apiKey: string) {
    const response = await fetch(this.model.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.model.id,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: this.model.maxTokens,
        temperature: this.model.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API call failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callGemini(messages: any[], apiKey: string) {
    // For Gemini, we need to add the API key as a query parameter
    const url = `${this.model.apiEndpoint}?key=${apiKey}`;
    
    // Gemini expects a different format for messages
    const lastMessage = messages[messages.length - 1];
    const systemPrompt = messages[0].content;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `${systemPrompt}\n\nUser: ${lastMessage.content}` }
          ]
        }],
        generationConfig: {
          maxOutputTokens: this.model.maxTokens,
          temperature: this.model.temperature,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API call failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async callClaude(messages: any[], apiKey: string) {
    const response = await fetch(this.model.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-2',
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        max_tokens: this.model.maxTokens,
        temperature: this.model.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API call failed');
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private formatContext(): string {
    const { userGoals, userTasks, customInstructions } = this.context;
    
    let contextStr = customInstructions?.systemPrompt || '';
    contextStr += '\n\n';
    
    if (userGoals?.length) {
      contextStr += 'Current Goals and Dreams:\n';
      userGoals.forEach(goal => {
        const status = (goal as UserGoal).status || 'N/A';
        const progress = (goal as UserGoal).progress_percentage || 0;
        contextStr += `- ${goal.title}\n  Status: ${status}\n  Progress: ${progress}%\n  Description: ${goal.description || 'No description'}\n\n`;
      });
    }

    if (userTasks?.length) {
      contextStr += 'Current Tasks and Progress:\n';
      userTasks.forEach(task => {
        contextStr += `- Task #${task.task_id}\n  Status: ${task.status}\n  Progress: Step ${task.current_step_index || 0}\n\n`;
      });
    }

    return contextStr;
  }

  public async sendMessage(message: string, customApiKey?: string): Promise<string> {
    const context = this.formatContext();
    const messages = [
      { role: 'system', content: context },
      { role: 'user', content: message }
    ];

    return await this.callAPI(messages, customApiKey);
  }

  public updateContext(newContext: Partial<AIContext>) {
    this.context = { ...this.context, ...newContext };
  }

  public setModel(model: AIModel) {
    this.model = model;
  }
} 