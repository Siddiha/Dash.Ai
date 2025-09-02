import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../index';
import { GmailService } from './integrations/gmail.service';
import { CalendarService } from './integrations/calendar.service';
import { SlackService } from './integrations/slack.service';
import { NotionService } from './integrations/notion.service';

export class WorkflowEngine {
  private queue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    
    this.queue = new Queue('workflows', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.worker = new Worker(
      'workflows',
      async (job) => {
        await this.executeWorkflow(job.data);
      },
      {
        connection: this.redis,
        concurrency: 5,
      }
    );

    this.queueEvents = new QueueEvents('workflows', {
      connection: this.redis,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.worker.on('completed', async (job) => {
      console.log(`Workflow ${job.data.id} completed`);
      await this.updateWorkflowExecution(job.data.executionId, 'completed', job.returnvalue);
    });

    this.worker.on('failed', async (job, err) => {
      console.error(`Workflow ${job?.data.id} failed:`, err);
      if (job) {
        await this.updateWorkflowExecution(job.data.executionId, 'failed', null, err.message);
      }
    });
  }

  async scheduleWorkflow(workflowId: string, trigger: any) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { user: true },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        status: 'pending',
      },
    });

    const jobData = {
      id: workflowId,
      executionId: execution.id,
      userId: workflow.userId,
      trigger,
      actions: workflow.actions,
    };

    if (trigger.type === 'schedule' && trigger.cron) {
      await this.queue.add(workflowId, jobData, {
        repeat: {
          pattern: trigger.cron,
        },
      });
    } else if (trigger.type === 'manual') {
      await this.queue.add(workflowId, jobData);
    } else if (trigger.type === 'webhook') {
      // Store webhook configuration
      await this.queue.add(workflowId, jobData, {
        delay: 0,
      });
    }

    return execution;
  }

  async executeWorkflow(data: any) {
    const { id, executionId, userId, actions } = data;

    await this.updateWorkflowExecution(executionId, 'running');

    const context: any = {
      userId,
      workflowId: id,
      executionId,
      variables: {},
      results: [],
    };

    // Get user's integrations
    const integrations = await prisma.integration.findMany({
      where: { userId, isActive: true },
    });

    for (const action of actions as any[]) {
      try {
        const result = await this.executeAction(action, context, integrations);
        context.results.push({ action: action.type, result, success: true });
        
        // Store result in context variables for use in subsequent actions
        if (action.outputVariable) {
          context.variables[action.outputVariable] = result;
        }
      } catch (error: any) {
        console.error(`Action ${action.type} failed:`, error);
        context.results.push({ action: action.type, error: error.message, success: false });
        
        if (action.stopOnError) {
          throw error;
        }
      }
    }

    // Update workflow lastRun
    await prisma.workflow.update({
      where: { id },
      data: { lastRun: new Date() },
    });

    return context.results;
  }

  private async executeAction(action: any, context: any, integrations: any[]) {
    const { type, params } = action;

    // Replace variables in params
    const resolvedParams = this.resolveVariables(params, context);

    switch (type) {
      case 'send_email':
        return await this.executeSendEmail(resolvedParams, integrations);
      
      case 'create_calendar_event':
        return await this.executeCreateCalendarEvent(resolvedParams, integrations);
      
      case 'send_slack_message':
        return await this.executeSendSlackMessage(resolvedParams, integrations);
      
      case 'create_notion_page':
        return await this.executeCreateNotionPage(resolvedParams, integrations);
      
      case 'search_emails':
        return await this.executeSearchEmails(resolvedParams, integrations);
      
      case 'wait':
        return await this.executeWait(resolvedParams);
      
      case 'condition':
        return await this.executeCondition(resolvedParams, context);
      
      case 'http_request':
        return await this.executeHttpRequest(resolvedParams);
      
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  private async executeSendEmail(params: any, integrations: any[]) {
    const gmailIntegration = integrations.find(i => i.type === 'gmail');
    if (!gmailIntegration) {
      throw new Error('Gmail integration not found');
    }

    const gmailService = new GmailService(gmailIntegration);
    return await gmailService.sendEmail(params.to, params.subject, params.body, params.cc, params.bcc);
  }

  private async executeCreateCalendarEvent(params: any, integrations: any[]) {
    const calendarIntegration = integrations.find(i => i.type === 'calendar');
    if (!calendarIntegration) {
      throw new Error('Calendar integration not found');
    }

    const calendarService = new CalendarService(calendarIntegration);
    return await calendarService.createEvent(params);
  }

  private async executeSendSlackMessage(params: any, integrations: any[]) {
    const slackIntegration = integrations.find(i => i.type === 'slack');
    if (!slackIntegration) {
      throw new Error('Slack integration not found');
    }

    const slackService = new SlackService(slackIntegration);
    return await slackService.sendMessage(params.channel, params.text, params.options);
  }

  private async executeCreateNotionPage(params: any, integrations: any[]) {
    const notionIntegration = integrations.find(i => i.type === 'notion');
    if (!notionIntegration) {
      throw new Error('Notion integration not found');
    }

    const notionService = new NotionService(notionIntegration);
    return await notionService.createPage(params);
  }

  private async executeSearchEmails(params: any, integrations: any[]) {
    const gmailIntegration = integrations.find(i => i.type === 'gmail');
    if (!gmailIntegration) {
      throw new Error('Gmail integration not found');
    }

    const gmailService = new GmailService(gmailIntegration);
    return await gmailService.searchEmails(params.query, params.maxResults);
  }

  private async executeWait(params: any) {
    const delay = params.seconds * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { waited: params.seconds };
  }

  private async executeCondition(params: any, context: any) {
    const { variable, operator, value } = params;
    const actualValue = context.variables[variable];

    let result = false;
    switch (operator) {
      case 'equals':
        result = actualValue === value;
        break;
      case 'not_equals':
        result = actualValue !== value;
        break;
      case 'contains':
        result = String(actualValue).includes(value);
        break;
      case 'greater_than':
        result = actualValue > value;
        break;
      case 'less_than':
        result = actualValue < value;
        break;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }

    return { condition: result };
  }

  private async executeHttpRequest(params: any) {
    const { url, method, headers, body } = params;

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return { status: response.status, data };
  }

  private resolveVariables(params: any, context: any): any {
    if (typeof params === 'string') {
      return params.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return context.variables[variable] || match;
      });
    }

    if (typeof params === 'object' && params !== null) {
      const resolved: any = Array.isArray(params) ? [] : {};
      for (const key in params) {
        resolved[key] = this.resolveVariables(params[key], context);
      }
      return resolved;
    }

    return params;
  }

  private async updateWorkflowExecution(
    executionId: string,
    status: string,
    result?: any,
    error?: string
  ) {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        result: result || undefined,
        error: error || undefined,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
      },
    });
  }

  async cancelWorkflow(workflowId: string) {
    const jobs = await this.queue.getRepeatableJobs();
    const job = jobs.find(j => j.id === workflowId);
    
    if (job) {
      await this.queue.removeRepeatableByKey(job.key);
      return true;
    }

    return false;
  }

  async getWorkflowStatus(workflowId: string) {
    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return executions;
  }
}