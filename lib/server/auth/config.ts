export const authConfig = {
  accessTokenCookieName: 'admin_access_token',
  refreshTokenCookieName: 'admin_refresh_token',
  accessTokenExpiry: 60 * 60 * 1000,
  refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000,
  
  get cookieDomain() {
    return process.env.NODE_ENV === 'production' ? 'like-svet-admin.vercel.app' : undefined;
  },
  
  jwtSecret: (() => {
    const secret = process.env.NODE_ENV === 'production' 
      ? process.env.JWT_SECRET_PROD 
      : process.env.JWT_SECRET;
    
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('❌ JWT_SECRET_PROD environment variable is required in production');
      }
      return 'dev-secret-only-for-development-change-in-production';
    }
    return secret;
  })(),
};