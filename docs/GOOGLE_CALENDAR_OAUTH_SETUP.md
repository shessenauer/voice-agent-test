# Google Calendar OAuth Setup Guide

This guide explains how to set up Google Calendar OAuth integration for the voice agent application.

## Overview

The application now supports real Google Calendar integration using OAuth 2.0. When properly configured, the calendar agent will interact with your actual Google Calendar instead of using mock data.

## Prerequisites

1. A Google Cloud Platform account
2. A Google Cloud Project with the Calendar API enabled
3. OAuth 2.0 credentials configured

## Setup Steps

### 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted:
   - Choose "External" user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add your domain to authorized domains
4. Create the OAuth 2.0 client:
   - Application type: "Web application"
   - Name: "Voice Agent Calendar Integration"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
   - For production, add your production domain

### 3. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Other existing variables...
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. OAuth Scopes

The application requests the following Google Calendar scopes:
- `https://www.googleapis.com/auth/calendar` - Full calendar access
- `https://www.googleapis.com/auth/calendar.events` - Calendar events access

## How It Works

### Authentication Flow

1. User clicks "Connect Google Calendar" in the settings page
2. Application redirects to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Application exchanges code for access and refresh tokens
6. Tokens are stored securely for future API calls

### API Integration

The calendar API routes (`/api/calendar/events`) now support both modes:

- **OAuth Mode**: When `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured and user is authenticated, uses real Google Calendar API
- **Mock Mode**: Falls back to mock data when OAuth is not configured or user is not authenticated

### Token Management

- Access tokens are automatically refreshed when they expire
- Tokens are stored in memory (for demo purposes)
- In production, implement secure token storage (database, encrypted files, etc.)

## Usage

### For Users

1. Go to the Settings page (`/dashboard/settings`)
2. In the "Integrations" section, click "Connect Google Calendar"
3. Complete the OAuth flow
4. Once connected, the calendar agent will use your real Google Calendar

### For Developers

The integration provides several key components:

- `GoogleCalendarAdapter`: MCP adapter for Google Calendar API
- `TokenManager`: Secure token storage and refresh logic
- `GoogleCalendarAuth`: React component for OAuth UI
- OAuth API routes: `/api/auth/google` and `/api/auth/google/callback`

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback

### Calendar Operations
- `GET /api/calendar/events` - List events (supports both OAuth and mock modes)
- `POST /api/calendar/events` - Create event
- `PUT /api/calendar/events?id={eventId}` - Update event
- `DELETE /api/calendar/events?id={eventId}` - Delete event

## Security Considerations

1. **Token Storage**: Currently uses in-memory storage. In production, use secure storage:
   - Encrypted database
   - Key management service (AWS KMS, Azure Key Vault)
   - Secure file storage with encryption

2. **HTTPS**: Always use HTTPS in production for OAuth redirects

3. **Token Refresh**: Implement proper token refresh logic to handle expired tokens

4. **User Association**: Associate tokens with specific users in a multi-user system

## Troubleshooting

### Common Issues

1. **"OAuth credentials not configured"**
   - Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`
   - Restart the development server after adding environment variables

2. **"Invalid redirect URI"**
   - Check that the redirect URI in Google Cloud Console matches `GOOGLE_REDIRECT_URI`
   - Ensure the URI is exactly: `http://localhost:3000/api/auth/google/callback`

3. **"Access denied" or "Invalid client"**
   - Verify the OAuth consent screen is properly configured
   - Check that the Calendar API is enabled
   - Ensure the client ID and secret are correct

4. **"Token refresh failed"**
   - The refresh token may have expired or been revoked
   - User needs to re-authenticate

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=google-calendar:*
```

## Production Deployment

1. Update redirect URIs in Google Cloud Console to include production domain
2. Set production environment variables
3. Implement secure token storage
4. Use HTTPS for all OAuth redirects
5. Consider implementing user management and token association

## Testing

The application gracefully falls back to mock data when OAuth is not configured, making it easy to test and develop without Google Calendar access.

To test the OAuth flow:
1. Set up the environment variables
2. Start the development server
3. Go to `/dashboard/settings`
4. Click "Connect Google Calendar"
5. Complete the OAuth flow
6. Test calendar operations in the voice agent
