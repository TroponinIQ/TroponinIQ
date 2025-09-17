import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Debug logging - check if we're on server or client
const isServer = typeof window === 'undefined';
console.log('[Firebase] Environment check:', {
  isServer,
  nodeEnv: process.env.NODE_ENV,
});

// Only initialize Firebase on the client side
let app: any = null;
let db: any = null;
let storage: any = null;

if (!isServer) {
  // Client-side initialization
  console.log('[Firebase] Client-side initialization...');
  
  // Debug logging
  console.log('[Firebase] Config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    storageBucket: firebaseConfig.storageBucket || 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
    appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 10)}...` : 'MISSING',
    measurementId: firebaseConfig.measurementId || 'MISSING',
  });

  // Validate required config
  const requiredFields = ['apiKey', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

  if (missingFields.length > 0) {
    console.error('[Firebase] Missing required environment variables:', missingFields);
    throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`);
  }

  // Initialize Firebase
  if (!getApps().length) {
    console.log('[Firebase] Initializing new app...');
    app = initializeApp(firebaseConfig);
  } else {
    console.log('[Firebase] Using existing app...');
    app = getApp();
  }

  console.log('[Firebase] Initializing Firestore and Storage...');
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  console.log('[Firebase] Server-side detected - skipping client Firebase initialization');
}

export { app, db, storage };
export type { FirebaseApp } from 'firebase/app'; 