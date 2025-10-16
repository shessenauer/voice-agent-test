/**
 * HTTP MCP Adapter
 * 
 * Handles MCP servers that communicate via HTTP REST API.
 * This is commonly used for cloud-based MCP services.
 */

import { BaseAdapter } from './baseAdapter';
import { MCPServerConfig, MCPTool, MCPToolResult } from '../types';

export class HttpAdapter extends BaseAdapter {
  private baseUrl?: string;
  private authHeaders?: Record<string, string>;

  async connect(config: MCPServerConfig): Promise<void> {
    this.validateConfig(config);
    this.config = config;
    this.baseUrl = config.url;

    try {
      // Set up authentication headers if provided
      if (config.auth) {
        this.authHeaders = this.createAuthHeaders(config.auth);
      }

      // Test connection by making a health check request
      console.log(`🔌 Connecting to HTTP MCP server: ${config.name} at ${config.url}`);
      
      // Simulate connection test
      await this.delay(200);
      
      this.connected = true;
      console.log(`✅ Connected to HTTP server: ${config.name}`);
    } catch (error) {
      console.error(`❌ Failed to connect to HTTP server ${config.name}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.baseUrl = undefined;
    this.authHeaders = undefined;
    console.log(`🔌 Disconnected from HTTP server: ${this.config?.name}`);
  }

  async discoverTools(): Promise<MCPTool[]> {
    if (!this.connected || !this.baseUrl) {
      throw new Error('Not connected to server');
    }

    try {
      // In a real implementation, this would make an HTTP request to /tools endpoint
      // For now, we'll return mock tools for HTTP-based services
      const mockTools: MCPTool[] = [
        {
          name: 'create_issue',
          description: 'Create a new GitHub issue',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Issue title'
              },
              body: {
                type: 'string',
                description: 'Issue description'
              },
              labels: {
                type: 'array',
                items: { type: 'string' },
                description: 'Issue labels'
              },
              assignees: {
                type: 'array',
                items: { type: 'string' },
                description: 'Issue assignees'
              }
            },
            required: ['title'],
            additionalProperties: false
          },
          server: this.config?.name || 'unknown'
        },
        {
          name: 'get_issues',
          description: 'Get GitHub issues with filters',
          inputSchema: {
            type: 'object',
            properties: {
              state: {
                type: 'string',
                enum: ['open', 'closed', 'all'],
                description: 'Issue state filter',
                default: 'open'
              },
              labels: {
                type: 'array',
                items: { type: 'string' },
                description: 'Label filters'
              },
              assignee: {
                type: 'string',
                description: 'Assignee filter'
              }
            },
            additionalProperties: false
          },
          server: this.config?.name || 'unknown'
        },
        {
          name: 'calendar_get_events',
          description: 'Get calendar events for a date range',
          inputSchema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date (ISO format)'
              },
              endDate: {
                type: 'string',
                description: 'End date (ISO format)'
              },
              calendarId: {
                type: 'string',
                description: 'Calendar ID (optional)',
                default: 'primary'
              }
            },
            required: ['startDate', 'endDate'],
            additionalProperties: false
          },
          server: this.config?.name || 'unknown'
        }
      ];

      console.log(`🔍 Discovered ${mockTools.length} tools from HTTP server: ${this.config?.name}`);
      return mockTools;

    } catch (error) {
      console.error(`❌ Failed to discover tools from HTTP server:`, error);
      throw error;
    }
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    if (!this.connected || !this.baseUrl) {
      throw new Error('Not connected to server');
    }

    const startTime = Date.now();

    try {
      // In a real implementation, this would make HTTP requests to the MCP server
      let result: any;
      
      switch (toolName) {
        case 'create_issue':
          result = await this.mockCreateIssue(args);
          break;
        case 'get_issues':
          result = await this.mockGetIssues(args);
          break;
        case 'calendar_get_events':
          result = await this.mockGetCalendarEvents(args);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      const executionTime = Date.now() - startTime;
      return this.createToolResult(true, result, undefined, executionTime);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.createToolResult(
        false, 
        undefined, 
        error instanceof Error ? error.message : 'Unknown error',
        executionTime
      );
    }
  }

  private createAuthHeaders(auth: any): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`;
        }
        break;
      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'apikey':
        if (auth.apiKey) {
          headers['X-API-Key'] = auth.apiKey;
        }
        break;
    }

    return headers;
  }

  private async mockCreateIssue(args: any): Promise<any> {
    await this.delay(300 + Math.random() * 500);

    return {
      id: Math.floor(Math.random() * 10000),
      number: Math.floor(Math.random() * 1000),
      title: args.title,
      body: args.body || '',
      state: 'open',
      labels: args.labels || [],
      assignees: args.assignees || [],
      createdAt: new Date().toISOString(),
      url: `https://github.com/example/repo/issues/${Math.floor(Math.random() * 1000)}`
    };
  }

  private async mockGetIssues(args: any): Promise<any> {
    await this.delay(200 + Math.random() * 300);

    const mockIssues = [
      {
        id: 1,
        number: 123,
        title: 'Sample Issue 1',
        body: 'This is a sample issue for testing',
        state: args.state || 'open',
        labels: ['bug', 'high-priority'],
        assignees: ['user1'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        url: 'https://github.com/example/repo/issues/123'
      },
      {
        id: 2,
        number: 124,
        title: 'Sample Issue 2',
        body: 'Another sample issue',
        state: args.state || 'open',
        labels: ['enhancement'],
        assignees: [],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        url: 'https://github.com/example/repo/issues/124'
      }
    ];

    return {
      issues: mockIssues,
      totalCount: mockIssues.length,
      filters: args
    };
  }

  private async mockGetCalendarEvents(args: any): Promise<any> {
    await this.delay(150 + Math.random() * 250);

    const mockEvents = [
      {
        id: 'event1',
        summary: 'Team Meeting',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        attendees: ['user1@example.com', 'user2@example.com']
      },
      {
        id: 'event2',
        summary: 'Project Review',
        start: {
          dateTime: new Date(Date.now() + 86400000).toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        end: {
          dateTime: new Date(Date.now() + 90000000).toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        attendees: ['user1@example.com']
      }
    ];

    return {
      events: mockEvents,
      timeRange: {
        start: args.startDate,
        end: args.endDate
      },
      calendarId: args.calendarId || 'primary'
    };
  }
}
