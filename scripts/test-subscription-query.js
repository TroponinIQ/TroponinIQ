const admin = require('firebase-admin');

// Initialize Firebase Admin (same as your app)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function testSubscriptionQuery(userId) {
  try {
    console.log(`Testing subscription query for user: ${userId}`);
    
    // Test the simplified query (what we're using now)
    console.log('Testing simplified query...');
    const snapshot = await db.collection('Subscriptions')
      .where('userId', '==', userId)
      .get();
    
    console.log(`✅ Simplified query succeeded. Found ${snapshot.docs.length} subscriptions`);
    
    // Test the complex query (what would need the composite index)
    console.log('Testing complex query...');
    try {
      const complexSnapshot = await db.collection('Subscriptions')
        .where('userId', '==', userId)
        .where('status', 'in', ['active', 'past_due'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      console.log(`✅ Complex query succeeded. Found ${complexSnapshot.docs.length} subscriptions`);
    } catch (error) {
      console.log(`❌ Complex query failed (expected if indexes aren't ready):`, error.message);
    }
    
    // Show subscription data
    if (!snapshot.empty) {
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Subscription ${index + 1}:`, {
          id: doc.id,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          currentPeriodEnd: data.currentPeriodEnd?.toDate?.() || data.currentPeriodEnd
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing subscription query:', error);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID: node scripts/test-subscription-query.js USER_ID');
  process.exit(1);
}

testSubscriptionQuery(userId).then(() => {
  console.log('Test completed');
  process.exit(0);
}); 