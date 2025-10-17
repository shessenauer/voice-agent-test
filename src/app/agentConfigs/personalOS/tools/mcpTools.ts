/**
 * MCP Tools for PersonalOS
 * 
 * This file creates and exports MCP tools for the PersonalOS agents.
 * Tools are created using the MCP tool factory and connected to
 * the appropriate agents.
 */

import { mcpToolFactory } from '../../../../lib/mcp/toolFactory';
import { mcpClient } from '../../../../lib/mcp/client';

// Initialize MCP client with mock servers
async function initializeMCPServers() {
  try {
    // Register mock servers for different services
    await mcpClient.registerServer({
      name: 'search-server',
      url: 'stdio://mock-search-server',
      type: 'stdio'
    });

    await mcpClient.registerServer({
      name: 'github-server',
      url: 'https://api.github.com/mcp',
      type: 'http',
      auth: {
        type: 'bearer',
        token: 'mock-github-token'
      }
    });

    // Calendar server is registered server-side via googleCalendarAdapter
    // See src/lib/mcp/serverSideRegistration.ts

    await mcpClient.registerServer({
      name: 'alexa-server',
      url: 'wss://alexa-api.amazon.com/mcp',
      type: 'websocket'
    });

    await mcpClient.registerServer({
      name: 'gmail-server',
      url: 'wss://gmail.googleapis.com/mcp',
      type: 'websocket'
    });

    console.log('✅ All MCP servers initialized');
  } catch (error) {
    console.error('❌ Failed to initialize MCP servers:', error);
  }
}

// Initialize servers on module load
initializeMCPServers();

// Export tool collections for different agents
export const searchTools = mcpToolFactory.createToolsByPattern(/^(web_search|deep_research)/i);
export const githubTools = mcpToolFactory.createToolsByPattern(/^(create_issue|update_issue|get_issues|create_project|update_project)/i);
// Calendar tools are now provided by the real Google Calendar API
// via server-side registration (see src/lib/mcp/serverSideRegistration.ts)
export const calendarTools: any[] = [];
export const emailTools = mcpToolFactory.createToolsByPattern(/^email_/i);
export const homeTools = mcpToolFactory.createToolsByPattern(/^alexa_/i);

// Export all tools for supervisor
export const allPersonalOSTools = [
  ...searchTools,
  ...githubTools,
  ...calendarTools,
  ...emailTools,
  ...homeTools
];

// Export individual tool collections for specific agents
export const webSearchTools = searchTools.filter(tool => 
  tool.name === 'web_search'
);

export const deepResearchTools = searchTools.filter(tool => 
  tool.name === 'deep_research'
);

export const issuesTools = githubTools.filter(tool => 
  tool.name.includes('issue')
);

export const projectTools = githubTools.filter(tool => 
  tool.name.includes('project')
);

// Calendar tools are now provided by the real Google Calendar API
// via server-side registration (see src/lib/mcp/serverSideRegistration.ts)
// These tools are available through the calendar API endpoints
export const calendarEventTools: any[] = [];

export const emailDraftTools = emailTools.filter(tool => 
  tool.name.includes('draft')
);

export const alexaLightTools = homeTools.filter(tool => 
  tool.name.includes('light')
);

export const alexaSceneTools = homeTools.filter(tool => 
  tool.name.includes('scene')
);

// Export MCP client for direct access if needed
export { mcpClient };
