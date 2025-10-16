/**
 * Base MCP Adapter
 * 
 * Abstract base class for MCP server adapters.
 * Provides common functionality and defines the interface
 * that all adapters must implement.
 */

import { MCPAdapter, MCPServerConfig, MCPTool, MCPToolResult } from '../types';

export abstract class BaseAdapter implements MCPAdapter {
  protected config?: MCPServerConfig;
  protected connected: boolean = false;

  abstract connect(config: MCPServerConfig): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract discoverTools(): Promise<MCPTool[]>;
  abstract callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult>;

  isConnected(): boolean {
    return this.connected;
  }

  protected validateConfig(config: MCPServerConfig): void {
    if (!config.name) {
      throw new Error('Server name is required');
    }
    if (!config.url) {
      throw new Error('Server URL is required');
    }
    if (!config.type) {
      throw new Error('Server type is required');
    }
  }

  protected createToolResult(success: boolean, data?: any, error?: string, executionTime?: number): MCPToolResult {
    return {
      success,
      data,
      error,
      executionTime
    };
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
