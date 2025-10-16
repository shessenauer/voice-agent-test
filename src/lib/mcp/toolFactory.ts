/**
 * MCP Tool Factory
 * 
 * Converts MCP tools to OpenAI function format and creates
 * tool instances that proxy to MCP servers.
 */

import { tool } from '@openai/agents/realtime';
import { MCPTool, JSONSchema, ToolFactory } from './types';
import { mcpClient } from './client';

export class MCPToolFactory implements ToolFactory {
  /**
   * Create an OpenAI tool from an MCP tool definition
   */
  createTool(mcpTool: MCPTool): any {
    return tool({
      name: mcpTool.name,
      description: mcpTool.description,
      parameters: this.convertSchema(mcpTool.inputSchema),
      execute: async (input: Record<string, any>, _details: any) => {
        try {
          // Call the MCP tool through the client
          const result = await mcpClient.callTool({
            server: mcpTool.server,
            tool: mcpTool.name,
            args: input
          });

          if (!result.success) {
            throw new Error(result.error || 'Tool execution failed');
          }

          return result.data;
        } catch (error) {
          console.error(`MCP tool ${mcpTool.name} failed:`, error);
          throw error;
        }
      }
    });
  }

  /**
   * Convert MCP JSON Schema to OpenAI function schema format
   */
  convertSchema(mcpSchema: JSONSchema): any {
    const openAISchema: any = {
      type: mcpSchema.type,
      properties: {},
      required: mcpSchema.required || [],
      additionalProperties: mcpSchema.additionalProperties !== false
    };

    // Convert properties recursively
    if (mcpSchema.properties) {
      for (const [key, value] of Object.entries(mcpSchema.properties)) {
        openAISchema.properties[key] = this.convertPropertySchema(value);
      }
    }

    // Handle array items
    if (mcpSchema.type === 'array' && mcpSchema.items) {
      openAISchema.items = this.convertPropertySchema(mcpSchema.items);
    }

    return openAISchema;
  }

  /**
   * Convert a single property schema
   */
  private convertPropertySchema(schema: JSONSchema): any {
    const converted: any = {
      type: schema.type,
      description: schema.description
    };

    // Handle nested properties
    if (schema.properties) {
      converted.properties = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        converted.properties[key] = this.convertPropertySchema(value);
      }
    }

    // Handle array items
    if (schema.type === 'array' && schema.items) {
      converted.items = this.convertPropertySchema(schema.items);
    }

    // Handle enums
    if (schema.enum) {
      converted.enum = schema.enum;
    }

    // Handle default values
    if (schema.default !== undefined) {
      converted.default = schema.default;
    }

    return converted;
  }

  /**
   * Create tools for all available MCP tools
   */
  createAllTools(): any[] {
    const allMCPTools = mcpClient.getAllTools();
    return allMCPTools.map(mcpTool => this.createTool(mcpTool));
  }

  /**
   * Create tools for a specific server
   */
  createServerTools(serverName: string): any[] {
    const serverTools = mcpClient.getServerTools(serverName);
    return serverTools.map(mcpTool => this.createTool(mcpTool));
  }

  /**
   * Create tools by name pattern (useful for filtering)
   */
  createToolsByPattern(pattern: RegExp): any[] {
    const allMCPTools = mcpClient.getAllTools();
    const matchingTools = allMCPTools.filter(tool => pattern.test(tool.name));
    return matchingTools.map(mcpTool => this.createTool(mcpTool));
  }
}

// Singleton instance
export const mcpToolFactory = new MCPToolFactory();

// Helper functions for common tool creation patterns

/**
 * Create tools for PersonalOS agents
 */
export function createPersonalOSTools(): any[] {
  const personalOSTools = mcpToolFactory.createToolsByPattern(
    /^(web_search|deep_research|create_task|update_task|get_tasks|calendar_|email_|alexa_)/i
  );
  return personalOSTools;
}

/**
 * Create tools for GitHub integration
 */
export function createGitHubTools(): any[] {
  const githubTools = mcpToolFactory.createToolsByPattern(
    /^(create_issue|update_issue|get_issues|create_project|update_project)/i
  );
  return githubTools;
}

/**
 * Create tools for calendar integration
 */
export function createCalendarTools(): any[] {
  const calendarTools = mcpToolFactory.createToolsByPattern(
    /^calendar_/i
  );
  return calendarTools;
}

/**
 * Create tools for email integration
 */
export function createEmailTools(): any[] {
  const emailTools = mcpToolFactory.createToolsByPattern(
    /^email_/i
  );
  return emailTools;
}

/**
 * Create tools for home automation
 */
export function createHomeTools(): any[] {
  const homeTools = mcpToolFactory.createToolsByPattern(
    /^alexa_/i
  );
  return homeTools;
}

/**
 * Create tools for search and research
 */
export function createSearchTools(): any[] {
  const searchTools = mcpToolFactory.createToolsByPattern(
    /^(web_search|deep_research)/i
  );
  return searchTools;
}

// Export the factory instance as default
export default mcpToolFactory;
