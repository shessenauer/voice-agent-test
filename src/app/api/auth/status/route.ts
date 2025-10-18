import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from '../../../../lib/auth/tokenManager';

export async function GET(_request: NextRequest) {
  try {
    const userId = 'default-user'; // In a real app, get from session
    const hasValidTokens = await tokenManager.hasValidTokens(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: hasValidTokens,
        userId
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
