/**
 * Google OAuth Callback Route
 * 
 * Handles the OAuth callback and exchanges authorization code for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeOAuth2Client, getTokensFromCode } from '../../../../../lib/mcp/adapters/googleCalendarAdapter';
import { registerServerSideMCPServers } from '../../../../../lib/mcp/serverSideRegistration';

// Register server-side MCP servers on module load
registerServerSideMCPServers();

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
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google OAuth credentials not configured' 
        },
        { status: 500 }
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

    // In a real application, you would store these tokens securely
    // For now, we'll return them (in production, store in database with user association)
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

  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete Google OAuth flow' },
      { status: 500 }
    );
  }
}
