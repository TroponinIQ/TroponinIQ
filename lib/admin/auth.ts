/**
 * Admin Authentication Utilities
 * 
 * Phase 1 Implementation: Email whitelist approach
 * Simple, secure, and production-ready admin access control
 */

// Admin email whitelist - configurable via environment variables
const getAdminEmailsFromEnv = (): string[] => {
  const envEmails = process.env.ADMIN_EMAILS;
  if (envEmails) {
    return envEmails.split(',').map(email => email.trim().toLowerCase());
  }
  
  // Fallback admin emails for development/initial setup
  return [
    'admin@troponiniq.com',
    'lhoang91@gmail.com', // Primary admin
    // Add more admin emails via ADMIN_EMAILS environment variable
  ];
};

const ADMIN_EMAILS = getAdminEmailsFromEnv();

/**
 * Check if a user email has admin privileges
 */
export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/**
 * Check if the current user session has admin privileges
 */
export function isAdminSession(user: { email?: string | null } | null | undefined): boolean {
  return isAdminUser(user?.email);
}

/**
 * Admin-only error response
 */
export function createAdminOnlyError() {
  return new Response(
    JSON.stringify({
      error: 'Admin access required',
      message: 'This endpoint requires administrator privileges'
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Middleware helper to validate admin access
 * Usage in API routes:
 * 
 * const session = await auth();
 * if (!isAdminSession(session?.user)) {
 *   return createAdminOnlyError();
 * }
 */
export function validateAdminAccess(user: { email?: string | null } | null | undefined) {
  if (!isAdminSession(user)) {
    throw new Error('Admin access required');
  }
}

// Future expansion: Role-based permissions
// This structure allows easy migration to database-driven roles later

export type AdminPermission = 
  | 'system_messages'
  | 'user_management' 
  | 'analytics'
  | 'feedback_management';

/**
 * Future: Check specific admin permissions
 * Currently returns true for all permissions if user is admin
 */
export function hasAdminPermission(
  user: { email?: string | null } | null | undefined,
  permission: AdminPermission
): boolean {
  // Phase 1: All admins have all permissions
  return isAdminSession(user);
  
  // Phase 2: Could implement granular permissions
  // return getUserPermissions(user?.email).includes(permission);
}

/**
 * Helper to add admin emails programmatically (for future use)
 */
export function addAdminEmail(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  if (!ADMIN_EMAILS.includes(normalizedEmail)) {
    ADMIN_EMAILS.push(normalizedEmail);
    console.log(`[Admin] Added admin email: ${normalizedEmail}`);
  }
}

/**
 * Get list of current admin emails (for admin management interface)
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}

export default {
  isAdminUser,
  isAdminSession,
  hasAdminPermission,
  validateAdminAccess,
  createAdminOnlyError,
  getAdminEmails
}; 