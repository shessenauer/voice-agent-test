/**
 * MCP Client Wrapper
 * 
 * Manages connections to MCP servers and provides a unified interface
 * for tool discovery and execution across different server types.
 */

import { 
  MCPServer, 
  MCPTool, 
  MCPToolCall, 
  MCPToolResult, 
  MCPToolExecution,
  MCPClientConfig,
  MCPServerConfig,
  ToolExecutionContext,
  MCPError,
  MCPTimeoutError,
  MCPConnectionError,
  MCPToolNotFoundError,
  MCPAdapter,
  ToolRegistry
} from './types';

// Import adapters (will be created next)
import { StdioAdapter } from './adapters/stdioAdapter';
import { HttpAdapter } from './adapters/httpAdapter';
import { WebSocketAdapter } from './adapters/websocketAdapter';

export class MCPClient {
  private servers: Map<string, MCPServer> = new Map();
  private tools: Map<string, MCPTool[]> = new Map();
  private executions: Map<string, MCPToolExecution> = new Map();
  private adapters: Map<string, MCPAdapter> = new Map();
  private config: MCPClientConfig;

  constructor(config: MCPClientConfig) {
    this.config = config;
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    // Initialize adapters for different server types
    this.adapters.set('stdio', new StdioAdapter());
    this.adapters.set('http', new HttpAdapter());
    this.adapters.set('websocket', new WebSocketAdapter());
  }

  /**
   * Register and connect to an MCP server
   */
  async registerServer(serverConfig: MCPServerConfig): Promise<void> {
    try {
      const server: MCPServer = {
        name: serverConfig.name,
        url: serverConfig.url,
        type: serverConfig.type,
        status: 'disconnected',
        lastConnected: undefined,
      };

      this.servers.set(serverConfig.name, server);

      // Get appropriate adapter
      const adapter = this.adapters.get(serverConfig.type);
      if (!adapter) {
        throw new MCPConnectionError(serverConfig.name, `Unsupported server type: ${serverConfig.type}`);
      }

      // Connect to server
      await adapter.connect(serverConfig);
      
      // Update server status
      server.status = 'connected';
      server.lastConnected = new Date();
      this.servers.set(serverConfig.name, server);

      // Store adapter for this server
      this.adapters.set(serverConfig.name, adapter);

      // Discover tools from this server
      await this.discoverTools(serverConfig.name);

      console.log(`✅ Connected to MCP server: ${serverConfig.name}`);
    } catch (error) {
      const server = this.servers.get(serverConfig.name);
      if (server) {
        server.status = 'error';
        server.error = error instanceof Error ? error.message : 'Unknown error';
        this.servers.set(serverConfig.name, server);
      }
      throw new MCPConnectionError(serverConfig.name, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Discover available tools from a server
   */
  async discoverTools(serverName: string): Promise<MCPTool[]> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new MCPError(`Server ${serverName} not found`);
    }

    if (server.status !== 'connected') {
      throw new MCPConnectionError(serverName, 'Server not connected');
    }

    try {
      const adapter = this.adapters.get(serverName);
      if (!adapter) {
        throw new MCPError(`No adapter found for server ${serverName}`);
      }

      const tools = await adapter.discoverTools();
      
      // Add server name to each tool
      const toolsWithServer = tools.map(tool => ({
        ...tool,
        server: serverName
      }));

      this.tools.set(serverName, toolsWithServer);
      console.log(`🔍 Discovered ${toolsWithServer.length} tools from ${serverName}`);
      
      return toolsWithServer;
    } catch (error) {
      console.error(`❌ Failed to discover tools from ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(
    toolCall: MCPToolCall, 
    _context?: ToolExecutionContext
  ): Promise<MCPToolResult> {
    const { server: serverName, tool: toolName, args, timeout } = toolCall;
    
    // Create execution record
    const executionId = this.generateExecutionId();
    const execution: MCPToolExecution = {
      id: executionId,
      server: serverName,
      tool: toolName,
      args,
      startTime: new Date(),
      status: 'pending'
    };
    this.executions.set(executionId, execution);

    try {
      // Validate server exists and is connected
      const server = this.servers.get(serverName);
      if (!server) {
        throw new MCPError(`Server ${serverName} not found`);
      }

      if (server.status !== 'connected') {
        throw new MCPConnectionError(serverName, 'Server not connected');
      }

      // Validate tool exists
      const serverTools = this.tools.get(serverName) || [];
      const tool = serverTools.find(t => t.name === toolName);
      if (!tool) {
        throw new MCPToolNotFoundError(serverName, toolName);
      }

      // Get adapter and call tool
      const adapter = this.adapters.get(serverName);
      if (!adapter) {
        throw new MCPError(`No adapter found for server ${serverName}`);
      }

      execution.status = 'running';
      this.executions.set(executionId, execution);

      // Determine timeout
      const effectiveTimeout = timeout || this.getDefaultTimeout(toolName);
      
      // Execute with timeout
      const result = await this.executeWithTimeout(
        () => adapter.callTool(toolName, args),
        effectiveTimeout,
        executionId
      );

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.result = result;
      this.executions.set(executionId, execution);

      console.log(`✅ Tool ${toolName} executed successfully on ${serverName} (${result.executionTime}ms)`);
      return result;

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      this.executions.set(executionId, execution);

      console.error(`❌ Tool ${toolName} failed on ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Get all available tools across all servers
   */
  getAllTools(): MCPTool[] {
    const allTools: MCPTool[] = [];
    for (const tools of this.tools.values()) {
      allTools.push(...tools);
    }
    return allTools;
  }

  /**
   * Get tools for a specific server
   */
  getServerTools(serverName: string): MCPTool[] {
    return this.tools.get(serverName) || [];
  }

  /**
   * Get server status
   */
  getServerStatus(serverName: string): MCPServer | undefined {
    return this.servers.get(serverName);
  }

  /**
   * Get all servers
   */
  getAllServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  /**
   * Disconnect from a server
   */
  async disconnectServer(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) {
      return;
    }

    try {
      const adapter = this.adapters.get(serverName);
      if (adapter) {
        await adapter.disconnect();
      }

      server.status = 'disconnected';
      this.servers.set(serverName, server);
      this.tools.delete(serverName);
      
      console.log(`🔌 Disconnected from server: ${serverName}`);
    } catch (error) {
      console.error(`❌ Error disconnecting from ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.servers.keys()).map(serverName => 
      this.disconnectServer(serverName)
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): MCPToolExecution[] {
    const executions = Array.from(this.executions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return limit ? executions.slice(0, limit) : executions;
  }

  /**
   * Get registry for external access
   */
  getRegistry(): ToolRegistry {
    return {
      tools: this.tools,
      servers: this.servers,
      executions: this.executions
    };
  }

  // Private helper methods

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultTimeout(toolName: string): number {
    // Special timeout for expensive operations
    if (toolName.includes('deep_research') || toolName.includes('research')) {
      return this.config.deepResearchTimeout;
    }
    return this.config.defaultTimeout;
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    executionId: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const execution = this.executions.get(executionId);
        if (execution) {
          execution.status = 'timeout';
          execution.endTime = new Date();
          this.executions.set(executionId, execution);
        }
        reject(new MCPTimeoutError('unknown', 'unknown', timeoutMs));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}

// Default configuration
const defaultConfig: MCPClientConfig = {
  defaultTimeout: 8000, // 8 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  deepResearchTimeout: 120000, // 2 minutes for deep research
  servers: []
};

// Singleton instance
export const mcpClient = new MCPClient(defaultConfig);

// Initialize with default servers if any are configured
if (defaultConfig.servers.length > 0) {
  defaultConfig.servers.forEach(serverConfig => {
    mcpClient.registerServer(serverConfig).catch(error => {
      console.error(`Failed to initialize server ${serverConfig.name}:`, error);
    });
  });
}
