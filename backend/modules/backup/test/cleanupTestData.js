import mongoose from 'mongoose';
import { connectDb, getLocalDbInstance } from '../../../configs/connect.db.js';
import { connectOnlineDb, getOnlineDbInstance } from '../../../configs/onlineConnect.db.js';

const TEST_PREFIX = 'SYNC_TEST_';

async function cleanupAllTestData() {
  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP: Removing all test data');
  console.log('='.repeat(60) + '\n');

  try {
    // Connect to both databases
    console.log('[INIT] Connecting to databases...');
    await connectDb();
    await connectOnlineDb();
    const localDb = getLocalDbInstance();
    const onlineDb = getOnlineDbInstance();

    if (!localDb || !onlineDb) {
      throw new Error('Database connections not established');
    }

    console.log('[INIT] Connections established\n');

    // Get all models from both databases
    const localModelNames = localDb.modelNames();
    const onlineModelNames = onlineDb.modelNames();

    console.log(`[INFO] Found ${localModelNames.length} local models`);
    console.log(`[INFO] Found ${onlineModelNames.length} online models\n`);

    // Models to skip (internal/tracking models)
    const skipModels = new Set(['ChangeTracks', 'ActivityLogs', 'ImageChangeTracks', 'Users', 'UserRoles']);

    // Process each model
    let totalLocalDeleted = 0;
    let totalOnlineDeleted = 0;

    for (const modelName of localModelNames) {
      if (skipModels.has(modelName)) {
        console.log(`[SKIP] ${modelName} (internal model)`);
        continue;
      }

      try {
        const localModel = localDb.model(modelName);
        const result = await localModel.deleteMany({ 
          $or: [
            { name: { $regex: TEST_PREFIX } },
            { description: { $regex: TEST_PREFIX } },
            { title: { $regex: TEST_PREFIX } },
          ]
        });

        if (result.deletedCount > 0) {
          console.log(`[LOCAL] ${modelName}: Deleted ${result.deletedCount} records`);
          totalLocalDeleted += result.deletedCount;
        }
      } catch (error) {
        console.log(`[ERROR] ${modelName}: ${error.message}`);
      }
    }

    for (const modelName of onlineModelNames) {
      if (skipModels.has(modelName)) {
        console.log(`[SKIP] ${modelName} (internal model)`);
        continue;
      }

      try {
        const onlineModel = onlineDb.model(modelName);
        const result = await onlineModel.deleteMany({ 
          $or: [
            { name: { $regex: TEST_PREFIX } },
            { description: { $regex: TEST_PREFIX } },
            { title: { $regex: TEST_PREFIX } },
          ]
        });

        if (result.deletedCount > 0) {
          console.log(`[ONLINE] ${modelName}: Deleted ${result.deletedCount} records`);
          totalOnlineDeleted += result.deletedCount;
        }
      } catch (error) {
        console.log(`[ERROR] ${modelName}: ${error.message}`);
      }
    }

    // Also cleanup by document field if exists
    console.log('\n[CLEANUP] Checking for test marker in other fields...');
    for (const modelName of localModelNames) {
      if (skipModels.has(modelName)) continue;
      
      try {
        const localModel = localDb.model(modelName);
        const count = await localModel.countDocuments({ documentId: { $regex: TEST_PREFIX } });
        if (count > 0) {
          const result = await localModel.deleteMany({ documentId: { $regex: TEST_PREFIX } });
          console.log(`[LOCAL] ${modelName} (documentId): Deleted ${result.deletedCount} records`);
          totalLocalDeleted += result.deletedCount;
        }
      } catch (error) {
        // Model doesn't have documentId field, skip
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`SUMMARY`);
    console.log('='.repeat(60));
    console.log(`Total local records deleted: ${totalLocalDeleted}`);
    console.log(`Total online records deleted: ${totalOnlineDeleted}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

  } catch (error) {
    console.error('\n[FATAL] Cleanup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Disconnect
    try {
      await mongoose.disconnect();
      console.log('[CLEANUP] Disconnected from databases');
    } catch (e) {
      console.error('Disconnect error:', e.message);
    }
    process.exit(0);
  }
}

cleanupAllTestData();
