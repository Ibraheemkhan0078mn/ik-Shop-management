import { getLocalUserModel } from "../../../configs/connect.db.js";
import { findOneUserService } from "./user.crud.js";

/**
 * Post-login data cleanup service
 * Manages local database cleanup based on user role after successful login
 * 
 * Rules:
 * - Admin role: Keep ALL user data in local DB (no cleanup)
 * - Staff/other roles: Remove ALL other users from local DB, keep only logged-in user
 * 
 * @param {Object} loggedInUser - The user who successfully logged in
 * @returns {Promise<Object>} Cleanup result with statistics
 */
export async function postLoginDataCleanup(loggedInUser) {
    try {
        const { _id: loggedInUserId, role, email } = loggedInUser;
        
        console.log(`\n🧹 === POST-LOGIN DATA CLEANUP ===`);
        console.log(`   👤 User: ${email} (${role})`);
        
        // Skip cleanup for admin users
        if (role === 'admin') {
            console.log(`   ✅ Admin user - no cleanup needed, keeping all user data`);
            return {
                success: true,
                role: 'admin',
                action: 'no_cleanup',
                message: 'Admin user - all user data preserved',
                usersRemoved: 0,
                usersKept: await countAllUsers()
            };
        }

        // For non-admin users, clean up other user data
        const LocalUserModel = getLocalUserModel();
        
        // Count users before cleanup
        const totalUsersBefore = await LocalUserModel.countDocuments({});
        const otherUsersCount = await LocalUserModel.countDocuments({ 
            _id: { $ne: loggedInUserId } 
        });
        
        console.log(`   📊 Users before cleanup: ${totalUsersBefore}`);
        console.log(`   🗑️  Other users to remove: ${otherUsersCount}`);
        
        if (otherUsersCount === 0) {
            console.log(`   ✅ No other users found - no cleanup needed`);
            return {
                success: true,
                role: role,
                action: 'no_cleanup_needed',
                message: 'No other users to remove',
                usersRemoved: 0,
                usersKept: 1
            };
        }

        // Remove all users except the logged-in user
        const deleteResult = await LocalUserModel.deleteMany({ 
            _id: { $ne: loggedInUserId } 
        });
        
        const usersRemoved = deleteResult.deletedCount;
        const totalUsersAfter = await LocalUserModel.countDocuments({});
        
        console.log(`   ✅ Cleanup completed:`);
        console.log(`      - Users removed: ${usersRemoved}`);
        console.log(`      - Users remaining: ${totalUsersAfter}`);
        console.log(`      - Only ${email} data kept in local DB`);
        
        return {
            success: true,
            role: role,
            action: 'cleanup_completed',
            message: `Removed ${usersRemoved} other users, kept only logged-in user data`,
            usersRemoved: usersRemoved,
            usersKept: totalUsersAfter,
            loggedInUserEmail: email
        };

    } catch (error) {
        console.error(`   ❌ Post-login cleanup failed:`, error.message);
        return {
            success: false,
            error: error.message,
            message: 'Failed to perform post-login cleanup'
        };
    }
}

/**
 * Count all users in local database
 * @returns {Promise<number>} Total user count
 */
async function countAllUsers() {
    try {
        const LocalUserModel = getLocalUserModel();
        return await LocalUserModel.countDocuments({});
    } catch (error) {
        console.error('Error counting users:', error.message);
        return 0;
    }
}

/**
 * Check if a user should trigger data cleanup
 * @param {string} role - User role
 * @returns {boolean} True if cleanup should be performed
 */
export function shouldPerformCleanup(role) {
    return role !== 'admin';
}

/**
 * Get cleanup preview (for testing/debugging)
 * @param {string} loggedInUserId - ID of logged-in user
 * @returns {Promise<Object>} Preview of what would be cleaned up
 */
export async function getCleanupPreview(loggedInUserId) {
    try {
        const LocalUserModel = getLocalUserModel();
        
        const totalUsers = await LocalUserModel.countDocuments({});
        const otherUsers = await LocalUserModel.find(
            { _id: { $ne: loggedInUserId } },
            { name: 1, email: 1, role: 1 }
        ).lean();
        
        return {
            totalUsers,
            usersToRemove: otherUsers.length,
            usersToKeep: 1,
            otherUsersPreview: otherUsers.slice(0, 5) // Show first 5 users
        };
    } catch (error) {
        return {
            error: error.message
        };
    }
}