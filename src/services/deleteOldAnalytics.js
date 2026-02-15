// functions/deleteOldAnalytics.js
// Firebase Cloud Function to automatically delete analytics data older than 10 days
// Deploy: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Run every day at 2 AM IST (midnight UTC + 2 hours = 2:30 AM UTC cron)
exports.deleteOldAnalytics = functions.pubsub
  .schedule('30 2 * * *') // Runs at 2:30 AM UTC (8 AM IST)
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('🗑️ Starting automatic analytics cleanup...');
    
    try {
      // Calculate date 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const tenDaysAgoISO = tenDaysAgo.toISOString();
      
      console.log(`📅 Deleting analytics older than: ${tenDaysAgoISO}`);
      
      // ✅ Delete old analytics (pageviews)
      const analyticsQuery = db.collection('analytics')
        .where('date', '<', tenDaysAgoISO)
        .limit(500); // Process in batches
      
      const analyticsSnapshot = await analyticsQuery.get();
      
      if (analyticsSnapshot.empty) {
        console.log('✅ No old analytics data to delete');
      } else {
        const batch = db.batch();
        let deletedCount = 0;
        
        analyticsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          deletedCount++;
        });
        
        await batch.commit();
        console.log(`✅ Deleted ${deletedCount} old analytics records`);
      }
      
      // ✅ Delete old user actions
      const actionsQuery = db.collection('user_actions')
        .where('date', '<', tenDaysAgoISO)
        .limit(500);
      
      const actionsSnapshot = await actionsQuery.get();
      
      if (actionsSnapshot.empty) {
        console.log('✅ No old user actions to delete');
      } else {
        const batch2 = db.batch();
        let deletedActionsCount = 0;
        
        actionsSnapshot.docs.forEach((doc) => {
          batch2.delete(doc.ref);
          deletedActionsCount++;
        });
        
        await batch2.commit();
        console.log(`✅ Deleted ${deletedActionsCount} old user action records`);
      }
      
      console.log('🎉 Analytics cleanup completed successfully!');
      return null;
      
    } catch (error) {
      console.error('❌ Error during analytics cleanup:', error);
      return null;
    }
  });

// ✅ Manual trigger function (optional - for testing)
exports.manualDeleteOldAnalytics = functions.https.onRequest(async (req, res) => {
  console.log('🗑️ Manual analytics cleanup triggered...');
  
  try {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const tenDaysAgoISO = tenDaysAgo.toISOString();
    
    // Delete analytics
    const analyticsQuery = db.collection('analytics')
      .where('date', '<', tenDaysAgoISO)
      .limit(500);
    
    const analyticsSnapshot = await analyticsQuery.get();
    const batch = db.batch();
    
    analyticsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Delete user actions
    const actionsQuery = db.collection('user_actions')
      .where('date', '<', tenDaysAgoISO)
      .limit(500);
    
    const actionsSnapshot = await actionsQuery.get();
    const batch2 = db.batch();
    
    actionsSnapshot.docs.forEach((doc) => {
      batch2.delete(doc.ref);
    });
    
    await batch2.commit();
    
    res.status(200).send({
      success: true,
      deletedAnalytics: analyticsSnapshot.size,
      deletedActions: actionsSnapshot.size,
      message: 'Old analytics data deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});