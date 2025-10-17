import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '../../../../lib/auth/tokenManager';

export async function POST(request: NextRequest) {
  try {
    const userId = 'default-user'; // In a real app, get from session
    
    // Revoke tokens and clear from storage
    await tokenManager.revokeTokens(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect'
    }, { status: 500 });
  }
}
