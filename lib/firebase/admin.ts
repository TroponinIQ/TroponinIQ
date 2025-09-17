import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

// Get or create Firebase Admin app
function getFirebaseAdminApp(): admin.app.App | null {
  try {
    // First, check if we already have a Firebase app
    if (admin.apps.length > 0) {
      const app = admin.apps[0];
      console.log('[Admin SDK] Using existing Firebase Admin app');
      return app;
    }

    console.log('[Admin SDK] Initializing Firebase Admin SDK...');

    // Try service account key file
    const serviceAccountPath = path.join(
      process.cwd(),
      'firebase-service-account-key.json',
    );

    if (fs.existsSync(serviceAccountPath)) {
      console.log('[Admin SDK] Using service account key file');

      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
      );

      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      console.log('[Admin SDK] Successfully initialized with service account key');
      console.log('[Admin SDK] Project ID:', app.options.projectId);

      return app;
    }

    // Fallback: Try environment variables
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      console.log('[Admin SDK] Using environment variables');
      console.log('[Admin SDK] Project ID:', process.env.FIREBASE_PROJECT_ID);
      console.log('[Admin SDK] Client Email:', `${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20)}...`);

      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      console.log('[Admin SDK] Successfully initialized with environment variables');

      return app;
    }

    console.log('[Admin SDK] Environment variables check:');
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'exists' : 'MISSING');
    console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'exists' : 'MISSING');
    console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'exists' : 'MISSING');

    throw new Error('No Firebase credentials found');
  } catch (error: any) {
    if (error?.code === 'app/duplicate-app') {
      // If we get a duplicate app error, just return the existing one
      console.log('[Admin SDK] Using existing Firebase app (duplicate app resolved)');
      return admin.apps[0] || null;
    }

    console.error('[Admin SDK] Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

// Export the admin SDK
export { admin };

// Get admin auth
export function getAdminAuth() {
  const app = getFirebaseAdminApp();
  return app ? admin.auth(app) : null;
}

// Get admin db
export function getAdminDb() {
  const app = getFirebaseAdminApp();
  return app ? admin.firestore(app) : null;
}

// Legacy exports for backwards compatibility
export const adminAuth = getAdminAuth();
export const adminDb = getAdminDb();

// Helper function to check if admin is initialized
export function isAdminInitialized(): boolean {
  return admin.apps.length > 0;
}
