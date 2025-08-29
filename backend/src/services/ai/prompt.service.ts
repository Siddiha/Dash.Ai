//backend / src / services / ai / prompt.service.ts;
export class PromptService {
  static buildSystemPrompt(context?: any): string {
    let prompt = `You are Dash.AI, an intelligent assistant that can help users manage their work across multiple platforms. You have access to:

- Gmail: Read, send, and organize emails
- Google Calendar: Schedule, update, and manage events  
- Notion: Create, update pages and databases
- Slack: Send messages and manage communications
- HubSpot: Manage contacts, deals, and sales tasks
- Linear: Create and update project tasks

Current capabilities:
- Analyze emails and suggest actions
- Schedule meetings and events
- Create tasks and reminders
- Send messages and notifications
- Generate reports and summaries
- Automate workflows between platforms

Guidelines:
- Always confirm actions before executing them
- Provide clear, actionable suggestions
- Ask for clarification when needed
- Be proactive in suggesting optimizations
- Maintain professional tone
- Respect privacy and security`;

    if (context) {
      prompt += `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}`;
    }

    return prompt;
  }

  static buildTaskAnalysisPrompt(tasks: any[]): string {
    return `Analyze these tasks and provide insights:
${JSON.stringify(tasks, null, 2)}

Please provide:
1. Priority recommendations
2. Time estimates
3. Dependency analysis
4. Optimization suggestions`;
  }

  static buildEmailSummaryPrompt(emails: any[]): string {
    return `Summarize these emails and extract action items:
${JSON.stringify(emails, null, 2)}

Please provide:
1. Brief summary of each email
2. Action items required
3. Priority classification
4. Suggested responses`;
  }
}
