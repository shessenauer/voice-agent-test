/**
 * Server-Side MCP Server Registration
 * 
 * This file handles server-side only MCP server registrations that use
 * Node.js-specific modules and cannot be bundled for the client.
 */

import { mcpClient } from './client';
import { googleCalendarMCPServer } from './adapters/googleCalendarAdapter';

/**
 * Register server-side only MCP servers
 * This should only be called from server-side code (API routes, etc.)
 */
export async function registerServerSideMCPServers() {
  try {
    // Register Google Calendar server with real OAuth integration
    await mcpClient.registerServer(googleCalendarMCPServer);
    
    console.log('✅ Server-side MCP servers registered');
  } catch (error) {
    console.error('❌ Failed to register server-side MCP servers:', error);
  }
}

export { googleCalendarMCPServer };
