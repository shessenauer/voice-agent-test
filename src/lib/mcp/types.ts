/**
 * MCP (Model Context Protocol) Type Definitions
 * 
 * These types define the interfaces for MCP client-server communication
 * and tool management within the PersonalOS system.
 */

export interface MCPServer {
  name: string;
  url: string;
  type: 'stdio' | 'http' | 'websocket';
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  server: string; // Server name that provides this tool
}

export interface MCPToolCall {
  server: string;
  tool: string;
  args: Record<string, any>;
  timeout?: number; // Override default timeout
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
}

export interface MCPToolExecution {
  id: string;
  server: string;
  tool: string;
  args: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  result?: MCPToolResult;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
}

// JSON Schema types for tool parameter validation
export interface JSONSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JSONSchema;
  enum?: any[];
  description?: string;
  default?: any;
  minimum?: number;
  maximum?: number;
}

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  url: string;
  type: 'stdio' | 'http' | 'websocket';
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

// MCP Client Configuration
export interface MCPClientConfig {
  defaultTimeout: number;
  maxRetries: number;
  retryDelay: number;
  deepResearchTimeout: number; // Special timeout for expensive operations
  servers: MCPServerConfig[];
}

// Tool execution context for logging and debugging
export interface ToolExecutionContext {
  agentName: string;
  sessionId?: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// MCP Error types
export class MCPError extends Error {
  constructor(
    message: string,
    public server?: string,
    public tool?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class MCPTimeoutError extends MCPError {
  constructor(server: string, tool: string, timeout: number) {
    super(`Tool ${tool} on server ${server} timed out after ${timeout}ms`, server, tool, 'TIMEOUT');
    this.name = 'MCPTimeoutError';
  }
}

export class MCPConnectionError extends MCPError {
  constructor(server: string, message: string) {
    super(`Connection to server ${server} failed: ${message}`, server, undefined, 'CONNECTION');
    this.name = 'MCPConnectionError';
  }
}

export class MCPToolNotFoundError extends MCPError {
  constructor(server: string, tool: string) {
    super(`Tool ${tool} not found on server ${server}`, server, tool, 'TOOL_NOT_FOUND');
    this.name = 'MCPToolNotFoundError';
  }
}

// Tool registration and discovery
export interface ToolRegistry {
  tools: Map<string, MCPTool[]>;
  servers: Map<string, MCPServer>;
  executions: Map<string, MCPToolExecution>;
}

// Adapter interface for different MCP server types
export interface MCPAdapter {
  connect(config: MCPServerConfig): Promise<void>;
  disconnect(): Promise<void>;
  discoverTools(): Promise<MCPTool[]>;
  callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult>;
  isConnected(): boolean;
}

// Tool factory interface for converting MCP tools to OpenAI format
export interface ToolFactory {
  createTool(mcpTool: MCPTool): any; // Returns OpenAI tool format
  convertSchema(mcpSchema: JSONSchema): any; // Converts MCP schema to OpenAI schema
}
