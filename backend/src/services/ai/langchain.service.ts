
// backend/src/services/ai/langchain.service.ts
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";

export class LangChainService {
  private model: ChatOpenAI;
  private memory: BufferMemory;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.memory = new BufferMemory({
      memoryKey: "history",
    });
  }

  async processConversation(input: string, context?: any): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(`
      You are Dash.AI, a helpful assistant that manages tasks across multiple platforms.
      
      Current context: {context}
      
      Conversation history:
      {history}
      
      Human: {input}
      Assistant:
    `);

    const chain = new ConversationChain({
      llm: this.model,
      memory: this.memory,
      prompt,
    });

    const response = await chain.call({
      input,
      context: context ? JSON.stringify(context) : "No additional context",
    });

    return response.response;
  }

  async extractActionItems(text: string): Promise<string[]> {
    const prompt = `Extract action items from the following text. Return them as a JSON array of strings:

    Text: ${text}
    
    Action items:`;

    const response = await this.model.call([{ role: "user", content: prompt }]);

    try {
      return JSON.parse(response.content);
    } catch {
      return [response.content];
    }
  }

  async categorizeContent(
    content: string,
    categories: string[]
  ): Promise<string> {
    const prompt = `Categorize the following content into one of these categories: ${categories.join(
      ", "
    )}

    Content: ${content}
    
    Category:`;

    const response = await this.model.call([{ role: "user", content: prompt }]);
    return response.content.trim();
  }

  async generateSummary(
    content: string,
    maxLength: number = 150
  ): Promise<string> {
    const prompt = `Summarize the following content in ${maxLength} characters or less:

    Content: ${content}
    
    Summary:`;

    const response = await this.model.call([{ role: "user", content: prompt }]);
    return response.content;
  }
}


