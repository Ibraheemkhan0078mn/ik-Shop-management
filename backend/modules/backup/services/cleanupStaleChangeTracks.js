import { getOnlineChangeTrackModel } from "../../../configs/onlineConnect.db.js";

/**
 * Cleanup stale change tracks from ONLINE database only
 * Removes change tracks older than 7 days to prevent accumulation
 * 
 * This function:
 * - Only affects ONLINE change tracks (local change tracks are kept as-is)
 * - Removes change tracks created more than 7 days ago
 * - Runs independently without affecting other sync logic
 * 
 * @returns {Promise<Object>} Result object with success status and statistics
 */
export async function cleanupStaleOnlineChangeTracks() {
    try {
        console.log('\n🧹 === CLEANUP STALE ONLINE CHANGE TRACKS ===');
        
        const onlineChangeTrackModel = getOnlineChangeTrackModel();
        
        // Calculate date 7 days ago
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        console.log(`   📅 Removing online change tracks older than: ${sevenDaysAgo.toISOString()}`);
        
        // Count before deletion
        const countBefore = await onlineChangeTrackModel.countDocuments({
            createdTimeForSync: { $lt: sevenDaysAgo }
        });
        
        if (countBefore === 0) {
            console.log('   ✅ No stale change tracks found');
            return {
                success: true,
                deleted: 0,
                message: 'No stale change tracks to cleanup'
            };
        }
        
        console.log(`   🔍 Found ${countBefore} stale change tracks to remove`);
        
        // Delete stale change tracks from ONLINE database only
        const deleteResult = await onlineChangeTrackModel.deleteMany({
            createdTimeForSync: { $lt: sevenDaysAgo }
        });
        
        console.log(`   ✅ Deleted ${deleteResult.deletedCount} stale online change tracks`);
        console.log('   ℹ️  Local change tracks preserved (not affected)');
        
        return {
            success: true,
            deleted: deleteResult.deletedCount,
            message: `Successfully cleaned up ${deleteResult.deletedCount} stale online change tracks`
        };
        
    } catch (error) {
        console.error('   ❌ Cleanup failed:', error.message);
        return {
            success: false,
            error: error.message,
            deleted: 0
        };
    }
}
