import { NextRequest, NextResponse } from 'next/server';
import type { CalendarEvent } from '../../../../types/api.types';

// Mock calendar events data
const mockEvents: CalendarEvent[] = [
  {
    id: 'event1',
    summary: 'Team Standup',
    description: 'Daily standup meeting to discuss progress and blockers',
    start: {
      dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      timeZone: 'America/Los_Angeles'
    },
    end: {
      dateTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
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
      dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      timeZone: 'America/Los_Angeles'
    },
    end: {
      dateTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
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
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      timeZone: 'America/Los_Angeles'
    },
    end: {
      dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
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
      dateTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
      timeZone: 'America/Los_Angeles'
    },
    end: {
      dateTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      timeZone: 'America/Los_Angeles'
    },
    attendees: ['sarah@example.com'],
    location: 'Downtown Bistro',
    calendarId: 'personal',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z'
  }
];

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
        calendarId
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

    // Generate new event
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
      data: newEvent
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
    
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { summary, description, start, end, attendees, location } = body;

    // Find and update event
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
      data: updatedEvent
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
    
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Find and remove event
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
      data: deletedEvent
    });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
