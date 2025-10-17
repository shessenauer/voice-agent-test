/**
 * Google Calendar MCP Adapter
 * 
 * This adapter provides real Google Calendar API integration using OAuth 2.0
 * for the Model Context Protocol (MCP) server.
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { MCPTool, MCPServer } from '../types';
import { tokenManager } from '../../auth/tokenManager';

// Google Calendar API scopes
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Calendar event interface
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: string[];
  location?: string;
  calendarId: string;
  createdAt: string;
  updatedAt: string;
}

// OAuth client instance
let oauth2Client: OAuth2Client | null = null;

/**
 * Initialize OAuth2 client with credentials
 */
export function initializeOAuth2Client(credentials: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  oauth2Client = new OAuth2Client(
    credentials.clientId,
    credentials.clientSecret,
    credentials.redirectUri
  );
  return oauth2Client;
}

/**
 * Set OAuth2 credentials (after user authorization)
 */
export function setCredentials(tokens: {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}) {
  if (!oauth2Client) {
    throw new Error('OAuth2 client not initialized');
  }
  
  oauth2Client.setCredentials(tokens);
}

/**
 * Initialize OAuth2 client with stored tokens for a user
 */
export async function initializeWithStoredTokens(userId: string): Promise<boolean> {
  try {
    const tokens = await tokenManager.getTokens(userId);
    
    if (!tokens) {
      return false;
    }

    // Initialize OAuth2 client with stored credentials
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return false;
    }

    oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials(tokens);
    return true;
  } catch (error) {
    console.error('Error initializing with stored tokens:', error);
    return false;
  }
}

/**
 * Get Google Calendar API instance
 */
function getCalendarAPI() {
  if (!oauth2Client) {
    throw new Error('OAuth2 client not initialized. Please authenticate first.');
  }
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Generate OAuth2 authorization URL
 */
export function getAuthUrl(): string {
  if (!oauth2Client) {
    throw new Error('OAuth2 client not initialized');
  }
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: CALENDAR_SCOPES,
    prompt: 'consent'
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  if (!oauth2Client) {
    throw new Error('OAuth2 client not initialized');
  }
  
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

/**
 * Refresh access token if needed
 */
export async function refreshTokenIfNeeded() {
  if (!oauth2Client) {
    throw new Error('OAuth2 client not initialized');
  }
  
  try {
    await oauth2Client.getAccessToken();
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh access token. Please re-authenticate.');
  }
}

/**
 * Get calendar events
 */
export async function getCalendarEvents(
  startDate: string,
  endDate: string,
  calendarId: string = 'primary',
  maxResults: number = 50
): Promise<CalendarEvent[]> {
  try {
    console.log('🔄 Refreshing token...');
    await refreshTokenIfNeeded();
    console.log('✅ Token refreshed successfully');
    
    console.log('📅 Getting calendar API instance...');
    const calendar = getCalendarAPI();
    console.log('✅ Calendar API instance created');
    
    console.log('🌐 Making Google Calendar API call...', {
      calendarId,
      timeMin: startDate,
      timeMax: endDate,
      maxResults
    });
    
    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate,
      timeMax: endDate,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
      showHiddenInvitations: false
    });
    
    console.log('✅ Google Calendar API response received:', {
      status: response.status,
      itemsCount: response.data.items?.length || 0
    });
    
    const events = response.data.items || [];
    
    return events.map(event => {
      console.log('📅 Processing event:', {
        id: event.id,
        summary: event.summary,
        start: {
          dateTime: event.start?.dateTime,
          date: event.start?.date,
          timeZone: event.start?.timeZone
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
          timeZone: event.end?.timeZone
        }
      });
      
      // Handle all-day events (date only) vs timed events (dateTime)
      const startDateTime = event.start?.dateTime || event.start?.date || '';
      const endDateTime = event.end?.dateTime || event.end?.date || '';
      
      // Convert date-only strings to proper ISO datetime strings
      const formatDateTime = (dateStr: string, timeZone: string, isEnd: boolean = false) => {
        if (!dateStr) return '';
        
        // If it's already a full datetime string, return as-is
        if (dateStr.includes('T')) {
          return dateStr;
        }
        
        // If it's a date-only string, add time component
        // For all-day events, use 00:00:00 for start and 23:59:59 for end
        if (isEnd) {
          return `${dateStr}T23:59:59.999Z`; // End of day in UTC
        } else {
          return `${dateStr}T00:00:00.000Z`; // Start of day in UTC
        }
      };
      
      return {
        id: event.id || '',
        summary: event.summary || '',
        description: event.description || '',
        start: {
          dateTime: formatDateTime(startDateTime, event.start?.timeZone || 'UTC', false),
          timeZone: event.start?.timeZone || 'UTC',
          isAllDay: !event.start?.dateTime && !!event.start?.date
        },
        end: {
          dateTime: formatDateTime(endDateTime, event.end?.timeZone || 'UTC', true),
          timeZone: event.end?.timeZone || 'UTC',
          isAllDay: !event.end?.dateTime && !!event.end?.date
        },
        attendees: event.attendees?.map(attendee => attendee.email || '') || [],
        location: event.location || '',
        calendarId,
        createdAt: event.created || '',
        updatedAt: event.updated || ''
      };
    });
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
    console.error('📊 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create calendar event
 */
export async function createCalendarEvent(
  summary: string,
  start: { dateTime: string; timeZone: string },
  end: { dateTime: string; timeZone: string },
  description?: string,
  attendees?: string[],
  location?: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  try {
    await refreshTokenIfNeeded();
    const calendar = getCalendarAPI();
    
    const event = {
      summary,
      description,
      start,
      end,
      attendees: attendees?.map(email => ({ email })),
      location
    };
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event
    });
    
    const createdEvent = response.data;
    
    return {
      id: createdEvent.id || '',
      summary: createdEvent.summary || '',
      description: createdEvent.description || '',
      start: {
        dateTime: createdEvent.start?.dateTime || createdEvent.start?.date || '',
        timeZone: createdEvent.start?.timeZone || 'UTC'
      },
      end: {
        dateTime: createdEvent.end?.dateTime || createdEvent.end?.date || '',
        timeZone: createdEvent.end?.timeZone || 'UTC'
      },
      attendees: createdEvent.attendees?.map(attendee => attendee.email || '') || [],
      location: createdEvent.location || '',
      calendarId,
      createdAt: createdEvent.created || '',
      updatedAt: createdEvent.updated || ''
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEvent>,
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  try {
    await refreshTokenIfNeeded();
    const calendar = getCalendarAPI();
    
    // First get the existing event
    const existingEvent = await calendar.events.get({
      calendarId,
      eventId
    });
    
    // Merge updates with existing event
    const updatedEvent = {
      ...existingEvent.data,
      summary: updates.summary || existingEvent.data.summary,
      description: updates.description !== undefined ? updates.description : existingEvent.data.description,
      start: updates.start || existingEvent.data.start,
      end: updates.end || existingEvent.data.end,
      attendees: updates.attendees?.map(email => ({ email })) || existingEvent.data.attendees,
      location: updates.location !== undefined ? updates.location : existingEvent.data.location
    };
    
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: updatedEvent
    });
    
    const result = response.data;
    
    return {
      id: result.id || '',
      summary: result.summary || '',
      description: result.description || '',
      start: {
        dateTime: result.start?.dateTime || result.start?.date || '',
        timeZone: result.start?.timeZone || 'UTC'
      },
      end: {
        dateTime: result.end?.dateTime || result.end?.date || '',
        timeZone: result.end?.timeZone || 'UTC'
      },
      attendees: result.attendees?.map(attendee => attendee.email || '') || [],
      location: result.location || '',
      calendarId,
      createdAt: result.created || '',
      updatedAt: result.updated || ''
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<boolean> {
  try {
    await refreshTokenIfNeeded();
    const calendar = getCalendarAPI();
    
    await calendar.events.delete({
      calendarId,
      eventId
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * MCP Tools for Google Calendar
 */
export const googleCalendarTools: MCPTool[] = [
  {
    name: 'calendar_get_events',
    description: 'Get calendar events for a specific date range',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in ISO format (e.g., 2024-01-01T00:00:00Z)'
        },
        endDate: {
          type: 'string',
          description: 'End date in ISO format (e.g., 2024-01-31T23:59:59Z)'
        },
        calendarId: {
          type: 'string',
          description: 'Calendar ID (default: primary)',
          default: 'primary'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of events to return (default: 50)',
          default: 50
        }
      },
      required: ['startDate', 'endDate']
    }
  },
  {
    name: 'calendar_create_event',
    description: 'Create a new calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Event title/summary'
        },
        start: {
          type: 'object',
          properties: {
            dateTime: { type: 'string' },
            timeZone: { type: 'string' }
          },
          required: ['dateTime']
        },
        end: {
          type: 'object',
          properties: {
            dateTime: { type: 'string' },
            timeZone: { type: 'string' }
          },
          required: ['dateTime']
        },
        description: {
          type: 'string',
          description: 'Event description'
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of attendee email addresses'
        },
        location: {
          type: 'string',
          description: 'Event location'
        },
        calendarId: {
          type: 'string',
          description: 'Calendar ID (default: primary)',
          default: 'primary'
        }
      },
      required: ['summary', 'start', 'end']
    }
  },
  {
    name: 'calendar_update_event',
    description: 'Update an existing calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'Event ID to update'
        },
        summary: { type: 'string' },
        description: { type: 'string' },
        start: {
          type: 'object',
          properties: {
            dateTime: { type: 'string' },
            timeZone: { type: 'string' }
          }
        },
        end: {
          type: 'object',
          properties: {
            dateTime: { type: 'string' },
            timeZone: { type: 'string' }
          }
        },
        attendees: {
          type: 'array',
          items: { type: 'string' }
        },
        location: { type: 'string' },
        calendarId: {
          type: 'string',
          default: 'primary'
        }
      },
      required: ['eventId']
    }
  },
  {
    name: 'calendar_delete_event',
    description: 'Delete a calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'Event ID to delete'
        },
        calendarId: {
          type: 'string',
          default: 'primary'
        }
      },
      required: ['eventId']
    }
  }
];

/**
 * Google Calendar MCP Server Configuration
 */
export const googleCalendarMCPServer: MCPServer = {
  name: 'google-calendar-server',
  url: 'https://www.googleapis.com/calendar/v3',
  type: 'http',
  auth: {
    type: 'oauth2',
    scopes: CALENDAR_SCOPES
  },
  tools: googleCalendarTools
};

export default googleCalendarMCPServer;
