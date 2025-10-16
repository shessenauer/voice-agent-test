'use client';

import React, { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  summary: string;
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
  description?: string;
}

interface CalendarPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function CalendarPanel({ isVisible, onToggle }: CalendarPanelProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewRange, setViewRange] = useState<'today' | 'week' | 'month'>('today');

  // Mock data for demonstration
  const mockEvents: CalendarEvent[] = [
    {
      id: 'event1',
      summary: 'Team Standup',
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
      description: 'Daily standup meeting to discuss progress and blockers'
    },
    {
      id: 'event2',
      summary: 'Client Meeting',
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
      description: 'Quarterly review with key client'
    },
    {
      id: 'event3',
      summary: 'Project Review',
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
      description: 'Weekly project status review and planning'
    }
  ];

  useEffect(() => {
    if (isVisible) {
      loadEvents();
    }
  }, [isVisible, viewRange]);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the MCP tool
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
      
      let filteredEvents = mockEvents;
      
      // Filter events based on view range
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (viewRange) {
        case 'today':
          filteredEvents = mockEvents.filter(event => {
            const eventDate = new Date(event.start.dateTime);
            return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          });
          break;
        case 'week':
          const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          filteredEvents = mockEvents.filter(event => {
            const eventDate = new Date(event.start.dateTime);
            return eventDate >= today && eventDate < weekEnd;
          });
          break;
        case 'month':
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          filteredEvents = mockEvents.filter(event => {
            const eventDate = new Date(event.start.dateTime);
            return eventDate >= today && eventDate <= monthEnd;
          });
          break;
      }
      
      // Sort events by start time
      filteredEvents.sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
      
      setEvents(filteredEvents);
    } catch (err) {
      setError('Failed to load calendar events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const isUpcoming = (event: CalendarEvent) => {
    const now = new Date();
    const eventStart = new Date(event.start.dateTime);
    const eventEnd = new Date(event.end.dateTime);
    
    return eventStart <= now && now <= eventEnd;
  };

  const isPast = (event: CalendarEvent) => {
    const now = new Date();
    const eventEnd = new Date(event.end.dateTime);
    
    return eventEnd < now;
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
          <span className="text-sm text-gray-500">({events.length})</span>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setViewRange(key as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewRange === key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-600">
            <div className="text-center">
              <p className="font-medium">Failed to load events</p>
              <button
                onClick={loadEvents}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="font-medium">No events scheduled</p>
              <p className="text-sm">Your calendar is clear for this period</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className={`border rounded-lg p-4 transition-all ${
                  isUpcoming(event)
                    ? 'border-blue-200 bg-blue-50'
                    : isPast(event)
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {event.summary}
                      </h4>
                      {isUpcoming(event) && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                          Now
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(event.start.dateTime)}</span>
                      </div>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {event.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
