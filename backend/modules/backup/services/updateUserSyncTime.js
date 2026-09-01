import { getLocalUserModel } from "../../../configs/connect.db.js";

/**
 * Update user's last sync time in local database
 * 
 * @param {String} userId - User ID to update
 * @returns {Object} - { success: boolean, message: string }
 */
export async function updateUserSyncTime(userId) {
  try {
    if (!userId) {
      console.warn("⚠️ No userId provided to updateUserSyncTime");
      return { success: false, message: "No userId provided" };
    }

    const LocalUserModel = getLocalUserModel();
    
    if (!LocalUserModel) {
      console.warn("⚠️ LocalUserModel not available");
      return { success: false, message: "LocalUserModel not available" };
    }

    // Update the user's lastSyncTime field
    const result = await LocalUserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          lastSyncTime: new Date()
        }
      },
      { new: true }
    );

    if (result) {
      console.log(`✅ Updated lastSyncTime for user: ${userId}`);
      return {
        success: true,
        message: "User sync time updated successfully",
        lastSyncTime: result.lastSyncTime
      };
    } else {
      console.warn(`⚠️ User not found: ${userId}`);
      return {
        success: false,
        message: "User not found"
      };
    }

  } catch (error) {
    console.error(`❌ Error updating user sync time:`, error);
    return {
      success: false,
      message: error?.message || error?.stack
    };
  }
}
