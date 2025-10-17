/**
 * MCP Tool Factory
 * 
 * Factory for creating OpenAI Realtime Agent tools from MCP tools.
 */

import { mcpClient } from './client';

export class MCPToolFactory {
  createToolsByPattern(pattern: RegExp) {
    const mcpTools = mcpClient.getToolsByPattern(pattern);
    
    return mcpTools.map(mcpTool => ({
      type: 'function' as const,
      function: {
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: mcpTool.parameters
      }
    }));
  }

  createTool(name: string) {
    const mcpTool = mcpClient.getTool(name);
    if (!mcpTool) {
      throw new Error(`Tool ${name} not found`);
    }

    return {
      type: 'function' as const,
      function: {
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: mcpTool.parameters
      }
    };
  }

  getAllTools() {
    const mcpTools = mcpClient.getAllTools();
    
    return mcpTools.map(mcpTool => ({
      type: 'function' as const,
      function: {
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: mcpTool.parameters
      }
    }));
  }
}

export const mcpToolFactory = new MCPToolFactory();
