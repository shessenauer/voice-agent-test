/**
 * Generated API Types for PersonalOS
 * 
 * These types are generated from the API schemas and used throughout
 * the application for type safety.
 */

// GitHub Issues Types
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface CreateIssueRequest {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface UpdateIssueRequest {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
}

export interface GetIssuesResponse {
  success: boolean;
  data: {
    issues: GitHubIssue[];
    totalCount: number;
    filters: {
      state: string;
      labels: string[];
      assignee: string | null;
      limit: number;
    };
  };
}

export interface CreateIssueResponse {
  success: boolean;
  data: GitHubIssue;
}

export interface UpdateIssueResponse {
  success: boolean;
  data: GitHubIssue;
}

// Calendar Events Types
export interface CalendarEvent {
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

export interface CreateEventRequest {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: string[];
  location?: string;
  calendarId?: string;
}

export interface UpdateEventRequest {
  summary?: string;
  description?: string;
  start?: {
    dateTime: string;
    timeZone?: string;
  };
  end?: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: string[];
  location?: string;
}

export interface GetEventsResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
    totalCount: number;
    timeRange: {
      start: string;
      end: string;
    };
    calendarId: string;
  };
}

export interface CreateEventResponse {
  success: boolean;
  data: CalendarEvent;
}

export interface UpdateEventResponse {
  success: boolean;
  data: CalendarEvent;
}

// Email Drafts Types
export interface EmailDraft {
  id: string;
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  status: 'draft' | 'sending' | 'sent' | 'failed';
  createdAt: string;
  lastModified: string;
  sentAt?: string;
  messageId?: string;
}

export interface CreateDraftRequest {
  to: string[];
  subject: string;
  body?: string;
  cc?: string[];
  bcc?: string[];
}

export interface UpdateDraftRequest {
  to?: string[];
  subject?: string;
  body?: string;
  cc?: string[];
  bcc?: string[];
}

export interface GetDraftsResponse {
  success: boolean;
  data: {
    drafts: EmailDraft[];
    totalCount: number;
    filters: {
      status: string;
      limit: number;
      sortBy: 'createdAt' | 'lastModified';
    };
  };
}

export interface CreateDraftResponse {
  success: boolean;
  data: EmailDraft;
}

export interface UpdateDraftResponse {
  success: boolean;
  data: EmailDraft;
}

export interface SendDraftResponse {
  success: boolean;
  data: EmailDraft;
}

// Home Devices Types
export interface AlexaDevice {
  id: string;
  name: string;
  type: 'light' | 'switch' | 'thermostat' | 'fan' | 'outlet';
  status: 'on' | 'off' | 'dimmed';
  brightness?: number;
  temperature?: number;
  targetTemperature?: number;
  room: string;
  lastUpdated: string;
  capabilities: ('on_off' | 'brightness' | 'color' | 'temperature_control' | 'fan_speed')[];
}

export interface AlexaScene {
  id: string;
  name: string;
  description: string;
  devices: string[];
  isActive: boolean;
  createdAt: string;
  lastActivated?: string | null;
}

export interface DeviceControlRequest {
  action: 'turn_on' | 'turn_off' | 'set_brightness' | 'set_temperature';
  brightness?: number;
  temperature?: number;
}

export interface GetDevicesResponse {
  success: boolean;
  data: {
    devices: AlexaDevice[];
    totalCount: number;
    filters: {
      room: string;
      type: string;
      status: string;
    };
  };
}

export interface ControlDeviceResponse {
  success: boolean;
  data: AlexaDevice;
}

export interface GetScenesResponse {
  success: boolean;
  data: {
    scenes: AlexaScene[];
    totalCount: number;
  };
}

export interface ActivateSceneResponse {
  success: boolean;
  data: {
    scene: AlexaScene;
    updatedDevices: AlexaDevice[];
  };
}

// Search & Research Types
export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  domain: string;
  publishedDate?: string;
  relevanceScore?: number;
}

export interface ResearchSource {
  name: string;
  url: string;
  reliability: 'high' | 'medium' | 'low';
}

export interface DeepResearchResult {
  question: string;
  summary: string;
  keyFindings: string[];
  detailedAnalysis: string;
  sources: ResearchSource[];
  recommendations: string[];
  researchTime: string;
  sourcesConsulted: number;
}

export interface WebSearchRequest {
  q: string;
  limit?: number;
  type?: 'web' | 'news' | 'images';
}

export interface DeepResearchRequest {
  query: string;
  type: 'deep_research';
  context?: string;
}

export interface WebSearchResponse {
  success: boolean;
  data: {
    query: string;
    results: SearchResult[];
    totalResults: number;
    searchTime: string;
    type: string;
  };
}

export interface DeepResearchResponse {
  success: boolean;
  data: DeepResearchResult;
}

// Common API Response Types
export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = T | ApiError;
