/**
 * Google Calendar OAuth Authentication Component
 * 
 * Provides UI for users to authenticate with Google Calendar
 */

'use client';

import { useState, useEffect } from 'react';

interface GoogleCalendarAuthProps {
  onAuthSuccess?: (tokens: any) => void;
  onAuthError?: (error: string) => void;
  className?: string;
}

export default function GoogleCalendarAuth({ 
  onAuthSuccess, 
  onAuthError, 
  className = '' 
}: GoogleCalendarAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setAuthUrl] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      // Check if user has valid tokens by making a test request
      const response = await fetch('/api/calendar/events?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z');
      const data = await response.json();
      
      if (data.success && data.data.source === 'google-calendar') {
        setIsAuthenticated(true);
      } else if (data.error && data.error.includes('authentication required')) {
        setIsAuthenticated(false);
        setAuthUrl(data.authUrl);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const initiateAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if already authenticated first
      const statusResponse = await fetch('/api/calendar/events?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z');
      const statusData = await statusResponse.json();
      
      if (statusData.success && statusData.data.source === 'google-calendar') {
        setIsAuthenticated(true);
        return;
      }

      // If not authenticated, proceed with OAuth
      const response = await fetch('/api/auth/google');
      const data = await response.json();

      if (data.success && data.data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to get authorization URL');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate authentication';
      setError(errorMessage);
      onAuthError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthCallback = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/google/callback?code=${code}`);
      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        onAuthSuccess?.(data.data.tokens);
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      onAuthError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth callback if code is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      setError(`OAuth error: ${error}`);
      onAuthError?.(`OAuth error: ${error}`);
    } else if (code) {
      handleAuthCallback(code);
    }
  }, []);

  if (isAuthenticated) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">Google Calendar Connected</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Connect Google Calendar
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Authenticate with Google to access your calendar events
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Authentication Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={initiateAuth}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Authenticating...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Connect Google Calendar
          </>
        )}
      </button>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>This will redirect you to Google to authorize calendar access.</p>
        <p>Your calendar data is only accessed locally and not stored on our servers.</p>
      </div>
    </div>
  );
}
