import { NextRequest, NextResponse } from 'next/server';
import type { CalendarEvent } from '../../../../types/api.types';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../../../lib/mcp/adapters/googleCalendarAdapter';
import { tokenManager } from '../../../../lib/auth/tokenManager';
import { registerServerSideMCPServers } from '../../../../lib/mcp/serverSideRegistration';

// Register server-side MCP servers on module load
registerServerSideMCPServers();

// Mock calendar events data (fallback when OAuth is not configured)
const mockEvents: CalendarEvent[] = [
  {
    id: 'event1',
    summary: 'Team Standup',
    description: 'Daily standup meeting to discuss progress and blockers',
    start: {
      dateTime: '2024-10-17T10:00:00Z', // Today at 10 AM UTC
      timeZone: 'America/Los_Angeles'
    },
    end: {
      dateTime: '2024-10-17T10:30:00Z', // Today at 10:30 AM UTC
      timeZone: 'America/Los_Angeles'
    },
    attendees: ['team@example.com', 'manager@example.com'],
    location: 'Conference Room A',
    calendarId: 'primary',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'event2',
    summary: 'Client Meeting',
    description: 'Quarterly review with key client',
    start: {
      dateTime: '2024-10-17T14:00:00Z', // Today at 2 PM UTC
      timeZone: 'America/Los_Angeles'
    },
    end: {
      dateTime: '2024-10-17T15:00:00Z', // Today at 3 PM UTC
      timeZone: 'America/Los_Angeles'
    },
    attendees: ['client@example.com'],
    location: 'Zoom',
    calendarId: 'primary',
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z'
  },
  {
    id: 'event3',
    summary: 'Project Review',
    description: 'Weekly project status review and planning',
    start: {
      dateTime: '2024-10-18T09:00:00Z', // Tomorrow at 9 AM UTC
      timeZone: 'America/Los_Angeles'
    },
    end: {
      dateTime: '2024-10-18T10:00:00Z', // Tomorrow at 10 AM UTC
      timeZone: 'America/Los_Angeles'
    },
    attendees: ['project.team@example.com'],
    location: 'Main Conference Room',
    calendarId: 'primary',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: 'event4',
    summary: 'Lunch with Sarah',
    description: 'Catch up over lunch',
    start: {
      dateTime: '2024-10-17T12:00:00Z', // Today at 12 PM UTC
      timeZone: 'America/Los_Angeles'
    },
    end: {
      dateTime: '2024-10-17T13:00:00Z', // Today at 1 PM UTC
      timeZone: 'America/Los_Angeles'
    },
    attendees: ['sarah@example.com'],
    location: 'Downtown Bistro',
    calendarId: 'personal',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z'
  }
];

/**
 * Check if Google Calendar OAuth is configured
 */
function isOAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Get user ID from request (in a real app, this would come from session/auth)
 * For demo purposes, we'll use a default user ID
 */
function getUserId(_request: NextRequest): string {
  // In a real application, extract user ID from session, JWT, or other auth mechanism
  return 'default-user';
}

// GET /api/calendar/events - Get events with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const calendarId = searchParams.get('calendarId') || 'primary';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Check if OAuth is configured and user has valid tokens
    if (isOAuthConfigured()) {
      const userId = getUserId(request);
      const hasValidTokens = await tokenManager.hasValidTokens(userId);
      
      if (hasValidTokens) {
        try {
          // Use real Google Calendar API
          const events = await getCalendarEvents(startDate, endDate, calendarId, limit);
          
          return NextResponse.json({
            success: true,
            data: {
              events,
              totalCount: events.length,
              timeRange: {
                start: startDate,
                end: endDate
              },
              calendarId,
              source: 'google-calendar'
            }
          });
        } catch (error) {
          console.error('Error fetching from Google Calendar:', error);
          // Fall back to mock data if Google Calendar fails
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Google Calendar authentication required. Please authenticate first.',
            authUrl: '/api/auth/google'
          },
          { status: 401 }
        );
      }
    }

    // Fallback to mock data
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Filter events based on query parameters
    let filteredEvents = mockEvents.filter(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      
      // Check if event overlaps with the requested time range
      return (eventStart >= start && eventStart < end) || 
             (eventEnd > start && eventEnd <= end) ||
             (eventStart <= start && eventEnd >= end);
    });

    // Filter by calendar ID
    if (calendarId !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.calendarId === calendarId);
    }

    // Sort by start time
    filteredEvents.sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());

    // Apply limit
    filteredEvents = filteredEvents.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        events: filteredEvents,
        totalCount: filteredEvents.length,
        timeRange: {
          start: startDate,
          end: endDate
        },
        calendarId,
        source: 'mock-data'
      }
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      summary, 
      description, 
      start, 
      end, 
      attendees = [], 
      location, 
      calendarId = 'primary' 
    } = body;

    if (!summary || !start || !end) {
      return NextResponse.json(
        { success: false, error: 'summary, start, and end are required' },
        { status: 400 }
      );
    }

    // Check if OAuth is configured and user has valid tokens
    if (isOAuthConfigured()) {
      const userId = getUserId(request);
      const hasValidTokens = await tokenManager.hasValidTokens(userId);
      
      if (hasValidTokens) {
        try {
          // Use real Google Calendar API
          const newEvent = await createCalendarEvent(
            summary,
            {
              dateTime: start.dateTime || start,
              timeZone: start.timeZone || 'America/Los_Angeles'
            },
            {
              dateTime: end.dateTime || end,
              timeZone: end.timeZone || 'America/Los_Angeles'
            },
            description,
            attendees,
            location,
            calendarId
          );

          return NextResponse.json({
            success: true,
            data: newEvent,
            source: 'google-calendar'
          }, { status: 201 });
        } catch (error) {
          console.error('Error creating event in Google Calendar:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to create event in Google Calendar' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Google Calendar authentication required. Please authenticate first.',
            authUrl: '/api/auth/google'
          },
          { status: 401 }
        );
      }
    }

    // Fallback to mock data
    const newEvent = {
      id: `event${Date.now()}`,
      summary,
      description: description || '',
      start: {
        dateTime: start.dateTime || start,
        timeZone: start.timeZone || 'America/Los_Angeles'
      },
      end: {
        dateTime: end.dateTime || end,
        timeZone: end.timeZone || 'America/Los_Angeles'
      },
      attendees,
      location: location || '',
      calendarId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to mock data (in real implementation, this would be saved to database)
    mockEvents.push(newEvent);

    return NextResponse.json({
      success: true,
      data: newEvent,
      source: 'mock-data'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/events/[id] - Update an event
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    const calendarId = searchParams.get('calendarId') || 'primary';
    
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { summary, description, start, end, attendees, location } = body;

    // Check if OAuth is configured and user has valid tokens
    if (isOAuthConfigured()) {
      const userId = getUserId(request);
      const hasValidTokens = await tokenManager.hasValidTokens(userId);
      
      if (hasValidTokens) {
        try {
          // Use real Google Calendar API
          const updatedEvent = await updateCalendarEvent(
            eventId,
            {
              summary,
              description,
              start: start ? {
                dateTime: start.dateTime || start,
                timeZone: start.timeZone || 'America/Los_Angeles'
              } : undefined,
              end: end ? {
                dateTime: end.dateTime || end,
                timeZone: end.timeZone || 'America/Los_Angeles'
              } : undefined,
              attendees,
              location
            },
            calendarId
          );

          return NextResponse.json({
            success: true,
            data: updatedEvent,
            source: 'google-calendar'
          });
        } catch (error) {
          console.error('Error updating event in Google Calendar:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to update event in Google Calendar' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Google Calendar authentication required. Please authenticate first.',
            authUrl: '/api/auth/google'
          },
          { status: 401 }
        );
      }
    }

    // Fallback to mock data
    const eventIndex = mockEvents.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const updatedEvent = {
      ...mockEvents[eventIndex],
      ...(summary && { summary }),
      ...(description !== undefined && { description }),
      ...(start && { start }),
      ...(end && { end }),
      ...(attendees && { attendees }),
      ...(location !== undefined && { location }),
      updatedAt: new Date().toISOString()
    };

    mockEvents[eventIndex] = updatedEvent;

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      source: 'mock-data'
    });

  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events/[id] - Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    const calendarId = searchParams.get('calendarId') || 'primary';
    
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if OAuth is configured and user has valid tokens
    if (isOAuthConfigured()) {
      const userId = getUserId(request);
      const hasValidTokens = await tokenManager.hasValidTokens(userId);
      
      if (hasValidTokens) {
        try {
          // Use real Google Calendar API
          await deleteCalendarEvent(eventId, calendarId);

          return NextResponse.json({
            success: true,
            data: { id: eventId, deleted: true },
            source: 'google-calendar'
          });
        } catch (error) {
          console.error('Error deleting event in Google Calendar:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to delete event in Google Calendar' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Google Calendar authentication required. Please authenticate first.',
            authUrl: '/api/auth/google'
          },
          { status: 401 }
        );
      }
    }

    // Fallback to mock data
    const eventIndex = mockEvents.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const deletedEvent = mockEvents.splice(eventIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedEvent,
      source: 'mock-data'
    });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
