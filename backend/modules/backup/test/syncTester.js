import mongoose from 'mongoose';
import { connectDb, getLocalDbInstance } from '../../../configs/connect.db.js';
import { connectOnlineDb, getOnlineDbInstance } from '../../../configs/onlineConnect.db.js';
import { onlineDocsUploadSyncInsert } from '../services/insertSync.js';
import { onlineDocsUploadSyncUpdate } from '../services/updateSync.js';
import { downloadOnlineSync } from '../services/downloadOnlineSync.js';
import { liveUpload } from '../services/changeTrackModelCreation.js';
import { getLocalProductModel, getLocalChangeTrackModel } from '../../../configs/connect.db.js';
import { getOnlineProductModel, getOnlineChangeTrackModel } from '../../../configs/onlineConnect.db.js';

const TEST_PREFIX = 'SYNC_TEST_';
const TEST_ADMIN = { role: 'admin', permissions: [], _id: 'test-admin' };
const testResults = [];

function shortError(error) {
  return String(error?.message || error)
    .replace(/^Error:\s*/i, '')
    .split('\n')[0]
    .replace(/\s+/g, ' ')
    .trim();
}

async function runTest(testName, testFunction) {
  try {
    await testFunction();
    testResults.push({ testName, passed: true });
  } catch (error) {
    testResults.push({ testName, passed: false, error: shortError(error) });
    console.log(`  ✗ ${testName}: ${shortError(error)}`);
  }
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function getModelsFromConnection(db, skipModels) {
  const models = {};
  const modelNames = db?.modelNames() || [];
  
  for (const modelName of modelNames) {
    if (skipModels.has(modelName)) continue;
    try {
      models[modelName] = db.model(modelName);
    } catch (error) {
      // Model not found, skip
    }
  }
  
  return models;
}

async function compareDocuments(localDoc, onlineDoc, docName) {
  if (!localDoc && !onlineDoc) {
    console.log(`  ✓ ${docName}: Both null (expected)`);
    return true;
  }
  if (!localDoc || !onlineDoc) {
    console.log(`  ✗ ${docName}: Mismatch - Local: ${!!localDoc}, Online: ${!!onlineDoc}`);
    throw new Error(`${docName}: document missing from one database`);
  }

  const localId = localDoc._id?.toString() || 'unknown';
  const onlineId = onlineDoc._id?.toString() || 'unknown';
  
  if (localId === onlineId) {
    console.log(`  ✓ ${docName}: Found in both DBs`);
    return true;
  }
  
  console.log(`  ✗ ${docName}: ID mismatch`);
  throw new Error(`${docName}: document IDs do not match`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTestName(suffix) {
  return `${TEST_PREFIX}${suffix}_${Date.now()}`;
}

// ─── Helper to Get All Model Pairs ──────────────────────────────────────────
function getAvailableModelPairs() {
  const skipModels = new Set(['ChangeTracks', 'ActivityLogs', 'ImageChangeTracks', 'Users', 'UserRoles']);
  const localDb = getLocalDbInstance();
  const onlineDb = getOnlineDbInstance();
  const localModels = getModelsFromConnection(localDb, skipModels);
  const onlineModels = getModelsFromConnection(onlineDb, skipModels);

  return Object.keys(localModels)
    .filter(modelName => onlineModels[modelName])
    .map(modelName => ({
      modelName,
      local: localModels[modelName],
      online: onlineModels[modelName],
      permissionString: [],
    }));
}

async function testAllModelsSync() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: ALL REGISTERED MODELS');
  console.log('='.repeat(60));

  const modelPairs = getAvailableModelPairs();
  if (modelPairs.length === 0) {
    throw new Error('no matching local/online models were detected');
  }

  console.log(`\n[1] Detected ${modelPairs.length} local/online model pairs`);
  await onlineDocsUploadSyncInsert(modelPairs, 'all', TEST_ADMIN);

  console.log('\n[2] Checking every detected model pair...');
  for (const pair of modelPairs) {
    if (pair.local.db !== getLocalDbInstance()) {
      throw new Error(`${pair.modelName}: local model belongs to the wrong connection`);
    }
    if (pair.online.db !== getOnlineDbInstance()) {
      throw new Error(`${pair.modelName}: online model belongs to the wrong connection`);
    }

    await Promise.all([
      pair.local.findOne({}, { _id: 1 }).lean(),
      pair.online.findOne({}, { _id: 1 }).lean(),
    ]);
    console.log(`  ✓ ${pair.modelName}`);
  }

  console.log(`\n[ALL MODELS] Checked ${modelPairs.length} model pairs\n`);
}

// ─── Test 1: Live Upload Test ───────────────────────────────────────────────

async function testLiveUpload() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: LIVE UPLOAD (Direct Change Track Cleanup)');
  console.log('='.repeat(60));

  try {
    const testName = getTestName('LiveUpload');
    const localProduct = getLocalProductModel();
    const onlineProduct = getOnlineProductModel();

    // Create a document
    console.log('\n[Step 1] Creating document in local DB...');
    const doc = await localProduct.create({
      name: testName,
      description: 'Testing live upload',
      price: 99.99,
      stock: 50,
      createdTimeForSync: new Date(),
      updateTimeForSync: new Date(),
    });
    console.log(`  ✓ Created: ${doc._id}`);

    // Trigger live upload
    console.log('\n[Step 2] Triggering liveUpload...');
    const result = await liveUpload('create', 'Products', doc._id);
    console.log(`  ✓ Upload completed: ${result}`);

    // Check online
    await delay(500);
    console.log('\n[Step 3] Verifying sync to online DB...');
    const onlineDoc = await onlineProduct.findById(doc._id);
    await compareDocuments(doc, onlineDoc, 'Document');

    console.log('\n[LIVE UPLOAD] Test completed\n');
  } catch (error) {
    console.error('[LIVE UPLOAD] Error:', error.message);
    throw error;
  }
}

// ─── Test 2: Insert Sync (Trigger Required Sync) ──────────────────────────

async function testInsertSync() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: INSERT SYNC (Required Sync Trigger)');
  console.log('='.repeat(60));

  try {
    const testName = getTestName('InsertSync');
    const localProduct = getLocalProductModel();
    const onlineProduct = getOnlineProductModel();

    // Create document
    console.log('\n[Step 1] Creating document in local DB...');
    const doc = await localProduct.create({
      name: testName,
      description: 'Insert sync test',
      price: 49.99,
      stock: 100,
      createdTimeForSync: new Date(),
      updateTimeForSync: new Date(),
    });
    console.log(`  ✓ Created: ${doc._id}`);

    // Manually trigger required insert sync
    console.log('\n[Step 2] Triggering required insert sync...');
    const modelArray = getAvailableModelPairs();
    console.log(`  ✓ Detected ${modelArray.length} local/online model pairs`);
    
    try {
      await onlineDocsUploadSyncInsert(modelArray, 'required', TEST_ADMIN);
      console.log(`  ✓ Sync executed`);
    } catch (syncError) {
      console.log(`  ! Sync error (expected if CT not marked): ${syncError.message}`);
    }

    // Check result
    await delay(500);
    console.log('\n[Step 3] Checking sync result...');
    const onlineDoc = await onlineProduct.findById(doc._id);
    await compareDocuments(doc, onlineDoc, 'Insert sync');

    console.log('\n[INSERT SYNC] Test completed\n');
  } catch (error) {
    console.error('[INSERT SYNC] Error:', error.message);
    throw error;
  }
}

// ─── Test 3: Update Sync with Timestamp ─────────────────────────────────────

async function testUpdateSync() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: UPDATE SYNC (Timestamp-based)');
  console.log('='.repeat(60));

  try {
    const testName = getTestName('UpdateSync');
    const localProduct = getLocalProductModel();
    const onlineProduct = getOnlineProductModel();

    // Create and sync initial document
    console.log('\n[Step 1] Creating initial document...');
    const doc = await localProduct.create({
      name: testName,
      description: 'Original',
      price: 29.99,
      stock: 50,
      createdTimeForSync: new Date(),
      updateTimeForSync: new Date(),
    });
    console.log(`  ✓ Created: ${doc._id}`);

    // Sync to online manually
    console.log('\n[Step 2] Initial sync to online...');
    await onlineProduct.updateOne(
      { _id: doc._id },
      { $set: doc.toObject() },
      { upsert: true }
    );
    console.log(`  ✓ Synced to online`);

    // Update locally
    console.log('\n[Step 3] Updating locally with newer timestamp...');
    doc.description = 'Updated';
    doc.price = 39.99;
    doc.updateTimeForSync = new Date();
    await doc.save();
    console.log(`  ✓ Updated locally`);
    console.log(`    New timestamp: ${doc.updateTimeForSync}`);

    // Trigger update sync
    console.log('\n[Step 4] Triggering update sync...');
    const modelArray = getAvailableModelPairs();

    try {
      await onlineDocsUploadSyncUpdate(modelArray, 'required', TEST_ADMIN);
      console.log(`  ✓ Sync executed`);
    } catch (syncError) {
      console.log(`  ! Sync error: ${syncError.message}`);
    }

    // Verify
    await delay(500);
    console.log('\n[Step 5] Verifying update...');
    const onlineDoc = await onlineProduct.findById(doc._id);
    if (onlineDoc && onlineDoc.description === 'Updated') {
      console.log(`  ✓ Update synced: ${onlineDoc.description}`);
    } else {
      console.log(`  ✗ Update NOT synced: ${onlineDoc?.description || 'not found'}`);
      throw new Error('updated document was not found online');
    }

    console.log('\n[UPDATE SYNC] Test completed\n');
  } catch (error) {
    console.error('[UPDATE SYNC] Error:', error.message);
    throw error;
  }
}

// ─── Test 4: Download Sync ──────────────────────────────────────────────────

async function testDownloadSync() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: DOWNLOAD SYNC (Online → Local)');
  console.log('='.repeat(60));

  try {
    const testName = getTestName('DownloadSync');
    const localProduct = getLocalProductModel();
    const onlineProduct = getOnlineProductModel();

    // Create in online
    console.log('\n[Step 1] Creating document in online DB...');
    const doc = await onlineProduct.create({
      name: testName,
      description: 'From online',
      price: 199.99,
      stock: 5,
      createdTimeForSync: new Date(),
      updateTimeForSync: new Date(),
    });
    console.log(`  ✓ Created in online: ${doc._id}`);

    // Trigger download sync
    console.log('\n[Step 2] Triggering download sync...');
    const modelArray = getAvailableModelPairs();

    try {
      await downloadOnlineSync(modelArray, 'all', TEST_ADMIN);
      console.log(`  ✓ Sync executed`);
    } catch (syncError) {
      console.log(`  ! Sync error: ${syncError.message}`);
    }

    // Verify
    await delay(500);
    console.log('\n[Step 3] Verifying download...');
    const localDoc = await localProduct.findById(doc._id);
    await compareDocuments(localDoc, doc, 'Download');

    console.log('\n[DOWNLOAD SYNC] Test completed\n');
  } catch (error) {
    console.error('[DOWNLOAD SYNC] Error:', error.message);
    throw error;
  }
}

// ─── Test 5: Soft Delete Sync ───────────────────────────────────────────────

async function testSoftDeleteSync() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: SOFT DELETE SYNC (isDeleted: true)');
  console.log('='.repeat(60));

  try {
    const testName = getTestName('DeleteSync');
    const localProduct = getLocalProductModel();
    const onlineProduct = getOnlineProductModel();

    // Create and sync
    console.log('\n[Step 1] Creating and syncing document...');
    const doc = await localProduct.create({
      name: testName,
      description: 'For soft delete',
      price: 59.99,
      stock: 20,
      createdTimeForSync: new Date(),
      updateTimeForSync: new Date(),
    });
    
    await onlineProduct.updateOne(
      { _id: doc._id },
      { $set: doc.toObject() },
      { upsert: true }
    );
    console.log(`  ✓ Created and synced: ${doc._id}`);

    // Soft delete
    console.log('\n[Step 2] Soft deleting (isDeleted: true)...');
    const updated = await localProduct.findOneAndUpdate(
      { _id: doc._id },
      { 
        isDeleted: true, 
        deletedAt: new Date(), 
        updateTimeForSync: new Date() 
      },
      { returnDocument: 'after' }
    );
    console.log(`  ✓ Marked as deleted`);

    // Trigger update sync
    console.log('\n[Step 3] Syncing soft delete...');
    const modelArray = getAvailableModelPairs();

    try {
      await onlineDocsUploadSyncUpdate(modelArray, 'required', TEST_ADMIN);
      console.log(`  ✓ Sync executed`);
    } catch (syncError) {
      console.log(`  ! Sync error: ${syncError.message}`);
    }

    // Verify
    await delay(500);
    console.log('\n[Step 4] Verifying soft delete...');
    const onlineDoc = await onlineProduct.findById(doc._id);
    if (onlineDoc && onlineDoc.isDeleted) {
      console.log(`  ✓ Soft delete synced to online`);
    } else {
      console.log(`  ✗ Soft delete NOT synced`);
      throw new Error('isDeleted flag was not synced online');
    }

    console.log('\n[SOFT DELETE SYNC] Test completed\n');
  } catch (error) {
    console.error('[SOFT DELETE SYNC] Error:', error.message);
    throw error;
  }
}

// ─── Test 6: Timestamp Conflict Resolution ──────────────────────────────────

async function testTimestampConflict() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: TIMESTAMP CONFLICT (Newer Wins)');
  console.log('='.repeat(60));

  try {
    const testName = getTestName('TimestampConflict');
    const localProduct = getLocalProductModel();
    const onlineProduct = getOnlineProductModel();
    const baseTime = new Date();

    // Create with same timestamp
    console.log('\n[Step 1] Creating in both DBs with same timestamp...');
    const docData = {
      name: testName,
      description: 'Same time',
      price: 79.99,
      stock: 30,
      createdTimeForSync: baseTime,
      updateTimeForSync: baseTime,
    };

    const localDoc = await localProduct.create(docData);
    const onlineDoc = await onlineProduct.create({ ...docData, _id: localDoc._id });
    console.log(`  ✓ Created in both`);

    // Update online with newer time
    console.log('\n[Step 2] Updating online with newer timestamp...');
    const newerTime = new Date(baseTime.getTime() + 10000);
    await onlineProduct.updateOne(
      { _id: onlineDoc._id },
      { description: 'Newer from online', updateTimeForSync: newerTime }
    );
    console.log(`  ✓ Online updated`);

    // Try to sync with older timestamp
    console.log('\n[Step 3] Attempting sync with older local timestamp...');
    const modelArray = getAvailableModelPairs();

    try {
      await onlineDocsUploadSyncUpdate(modelArray, 'required', TEST_ADMIN);
      console.log(`  ✓ Sync executed`);
    } catch (syncError) {
      console.log(`  ! Sync error: ${syncError.message}`);
    }

    // Verify newer won
    await delay(500);
    console.log('\n[Step 4] Verifying newer timestamp preserved...');
    const finalDoc = await onlineProduct.findById(localDoc._id);
    if (finalDoc.description === 'Newer from online') {
      console.log(`  ✓ Newer version preserved: ${finalDoc.description}`);
    } else {
      console.log(`  ✗ Newer version NOT preserved`);
      throw new Error('newer timestamp version was not preserved');
    }

    console.log('\n[TIMESTAMP CONFLICT] Test completed\n');
  } catch (error) {
    console.error('[TIMESTAMP CONFLICT] Error:', error.message);
    throw error;
  }
}

// ─── Main Runner ────────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         BACKUP SYNC INDEPENDENT TEST SUITE');
  console.log('║    (Database-level tests, independent from sync functions)');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Start: ${new Date().toISOString()}`);
  console.log(`Test marker: ${TEST_PREFIX}*\n`);

  try {
    console.log('[INIT] Connecting to databases...');
    await connectDb();
    await connectOnlineDb();
    console.log('[INIT] Connected\n');

    // Run tests and collect one final result per test.
    await runTest('All registered models', testAllModelsSync);
    await runTest('Live upload', testLiveUpload);
    await runTest('Insert sync', testInsertSync);
    await runTest('Update sync', testUpdateSync);
    await runTest('Download sync', testDownloadSync);
    await runTest('Soft delete sync', testSoftDeleteSync);
    await runTest('Timestamp conflict', testTimestampConflict);

    const failedTests = testResults.filter(result => !result.passed);
    console.log('\n' + '='.repeat(60));
    console.log('PROBLEMS');
    if (failedTests.length > 0) {
      for (const result of failedTests) {
        console.log(`- ${result.testName}: ${result.error}`);
      }
    } else {
      console.log('0 problems');
    }
    console.log('='.repeat(60));

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ALL TESTS COMPLETED');
    console.log('║   Use: node cleanupTestData.js  to remove test records');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`End: ${new Date().toISOString()}\n`);

  } catch (error) {
    console.error('\n[FATAL] Test error:', error.message);
    console.error(error.stack);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('[CLEANUP] Disconnected\n');
    } catch (e) {
      console.error('Disconnect error:', e.message);
    }
    process.exit(0);
  }
}

// Execute
runTests();
