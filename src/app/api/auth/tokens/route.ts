import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '../../../../lib/auth/tokenManager';

export async function GET(_request: NextRequest) {
  try {
    const userId = 'default-user'; // In a real app, get from session
    const tokens = await tokenManager.getTokens(userId);
    
    if (!tokens) {
      return NextResponse.json({
        success: false,
        error: 'No tokens found'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        tokens: {
          access_token: tokens.access_token ? '***' + tokens.access_token.slice(-10) : 'none',
          refresh_token: tokens.refresh_token ? '***' + tokens.refresh_token.slice(-10) : 'none',
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date,
          createdAt: new Date(tokens.expiry_date - (365 * 24 * 60 * 60 * 1000)).toISOString() // Estimate creation time
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
