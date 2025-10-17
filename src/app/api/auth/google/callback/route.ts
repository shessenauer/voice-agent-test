/**
 * Google OAuth Callback Route
 * 
 * Handles the OAuth callback and exchanges authorization code for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeOAuth2Client, getTokensFromCode } from '../../../../../lib/mcp/adapters/googleCalendarAdapter';
import { tokenManager } from '../../../../../lib/auth/tokenManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: `OAuth error: ${error}` 
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authorization code not provided' 
        },
        { status: 400 }
      );
    }

    // Get OAuth credentials from environment
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google OAuth credentials not configured' 
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

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Store tokens securely (using default user ID for demo)
    await tokenManager.storeTokens('default-user', tokens);

    // Check if this is a test request (has test code)
    if (code === 'test') {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Successfully authenticated with Google Calendar',
          tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            scope: tokens.scope,
            token_type: tokens.token_type,
            expiry_date: tokens.expiry_date
          }
        }
      });
    }

    // Redirect back to settings page with success message
    const settingsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/settings?auth=success`;
    return NextResponse.redirect(settingsUrl);

  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete Google OAuth flow' },
      { status: 500 }
    );
  }
}
