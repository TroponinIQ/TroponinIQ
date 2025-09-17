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

async function simulateSubscription(userId, customerEmail) {
  try {
    console.log(`Simulating subscription for user: ${userId}`);
    
    // Create a fake Stripe customer ID
    const fakeCustomerId = `cus_test_${Date.now()}`;
    const fakeSubscriptionId = `sub_test_${Date.now()}`;
    
    // Update user with Stripe customer ID
    await db.collection('Users').doc(userId).update({
      stripeCustomerId: fakeCustomerId,
      activeSubscriptionId: fakeSubscriptionId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create subscription record
    await db.collection('Subscriptions').add({
      userId: userId,
      stripeSubscriptionId: fakeSubscriptionId,
      stripeCustomerId: fakeCustomerId,
      status: 'active',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_test_123',
      currentPeriodStart: admin.firestore.Timestamp.now(),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      ),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Subscription simulation complete!');
    console.log(`User ${userId} now has active subscription`);
    console.log(`Fake Customer ID: ${fakeCustomerId}`);
    console.log(`Fake Subscription ID: ${fakeSubscriptionId}`);
    
  } catch (error) {
    console.error('❌ Error simulating subscription:', error);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID: node scripts/simulate-subscription.js USER_ID');
  process.exit(1);
}

simulateSubscription(userId).then(() => {
  console.log('Script completed');
  process.exit(0);
}); 