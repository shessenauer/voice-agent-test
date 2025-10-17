/**
 * Google OAuth Authentication Route
 * 
 * Initiates Google OAuth flow for calendar access
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeOAuth2Client, getAuthUrl } from '../../../../lib/mcp/adapters/googleCalendarAdapter';

export async function GET(_request: NextRequest) {
  try {
    // Get OAuth credentials from environment
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
          setupRequired: true
        },
        { status: 400 }
      );
    }

    // Initialize OAuth2 client
    initializeOAuth2Client({
      clientId,
      clientSecret,
      redirectUri
    });

    // Generate authorization URL
    const authUrl = getAuthUrl();

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        message: 'Redirect user to this URL to authorize calendar access'
      }
    });

  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}
