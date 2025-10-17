/**
 * Token Management Service
 * 
 * Handles secure storage and refresh of OAuth tokens
 * In production, this should use a secure database or key management service
 */

import { OAuth2Client } from 'google-auth-library';

interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
  user_id?: string;
}

// In-memory storage for demo purposes
// In production, use a secure database or key management service
const tokenStore = new Map<string, StoredTokens>();

export class TokenManager {
  private static instance: TokenManager;
  private oauth2Client: OAuth2Client | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Initialize OAuth2 client
   */
  initializeOAuth2Client(credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }): OAuth2Client {
    this.oauth2Client = new OAuth2Client(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );
    return this.oauth2Client;
  }

  /**
   * Store tokens for a user
   */
  async storeTokens(userId: string, tokens: StoredTokens): Promise<void> {
    // In production, encrypt tokens before storing
    tokenStore.set(userId, { ...tokens, user_id: userId });
  }

  /**
   * Get stored tokens for a user
   */
  async getTokens(userId: string): Promise<StoredTokens | null> {
    return tokenStore.get(userId) || null;
  }

  /**
   * Get OAuth2 client with user's tokens
   */
  async getOAuth2Client(userId: string): Promise<OAuth2Client | null> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const tokens = await this.getTokens(userId);
    if (!tokens) {
      return null;
    }

    this.oauth2Client.setCredentials(tokens);
    return this.oauth2Client;
  }

  /**
   * Refresh tokens if needed
   */
  async refreshTokensIfNeeded(userId: string): Promise<boolean> {
    const tokens = await this.getTokens(userId);
    if (!tokens || !this.oauth2Client) {
      return false;
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Date.now();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes

    if (tokens.expiry_date && now >= (tokens.expiry_date - expiryBuffer)) {
      try {
        this.oauth2Client.setCredentials(tokens);
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        // Update stored tokens
        const updatedTokens: StoredTokens = {
          ...tokens,
          access_token: credentials.access_token || tokens.access_token,
          expiry_date: credentials.expiry_date || tokens.expiry_date
        };

        await this.storeTokens(userId, updatedTokens);
        return true;
      } catch (error) {
        console.error('Error refreshing tokens:', error);
        return false;
      }
    }

    return true; // Tokens are still valid
  }

  /**
   * Revoke tokens for a user
   */
  async revokeTokens(userId: string): Promise<void> {
    const tokens = await this.getTokens(userId);
    if (tokens && this.oauth2Client) {
      try {
        this.oauth2Client.setCredentials(tokens);
        await this.oauth2Client.revokeCredentials();
      } catch (error) {
        console.error('Error revoking tokens:', error);
      }
    }
    
    tokenStore.delete(userId);
  }

  /**
   * Check if user has valid tokens
   */
  async hasValidTokens(userId: string): Promise<boolean> {
    const tokens = await this.getTokens(userId);
    if (!tokens) {
      return false;
    }

    // Check if token is expired
    const now = Date.now();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes

    if (tokens.expiry_date && now >= (tokens.expiry_date - expiryBuffer)) {
      // Try to refresh
      return await this.refreshTokensIfNeeded(userId);
    }

    return true;
  }

  /**
   * Get all users with stored tokens
   */
  async getAllUsers(): Promise<string[]> {
    return Array.from(tokenStore.keys());
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
