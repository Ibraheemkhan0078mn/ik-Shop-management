import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import { uploadDir } from "../../../common/services/uploadDirectory.js";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from "../../../common/constants/env.js";

// Configure Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

/**
 * Model configurations with image field names
 */
const MODEL_IMAGE_CONFIG = {
    Products: { imageField: 'image', publicIdField: 'cloudinaryPublicId' },
    Suppliers: { imageField: 'image', publicIdField: 'cloudinaryPublicId' },
    Staff: { imageField: 'photo', publicIdField: 'cloudinaryPublicId' },
    Customer: { imageField: 'image', publicIdField: 'cloudinaryPublicId' },
    User: { imageField: 'photo', publicIdField: 'cloudinaryPublicId' },
    QarzaAccount: { imageField: 'qarzaProfileImage', publicIdField: 'cloudinaryPublicId' },
    Settings: { imageField: 'shop.imageUrl', publicIdField: null, nested: true }, // Nested field
    Categories: { imageField: 'image', publicIdField: null },
    SubCategories: { imageField: 'image', publicIdField: null },
};

/**
 * Main image sync function
 * Handles:
 * 1. Upload missing images to Cloudinary
 * 2. Download missing local images from Cloudinary
 * 3. Clean up orphaned images
 */
export async function imageFullSync(modelArray, loggedInUserData) {
    console.log('\n🖼️  === IMAGE FULL SYNC STARTED ===');
    
    try {
        const stats = {
            uploadedToCloudinary: 0,
            downloadedToLocal: 0,
            orphanedDeleted: 0,
            errors: []
        };

        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Track all valid image filenames across all models
        const allValidImages = new Set();

        // Process each model
        for (const modelObj of modelArray) {
            const LocalModel = modelObj.local;
            const modelName = LocalModel.modelName;
            const config = MODEL_IMAGE_CONFIG[modelName];

            if (!config) {
                console.log(`⏭️  Skipping ${modelName} - no image configuration`);
                continue;
            }

            console.log(`\n📦 Processing model: ${modelName}`);

            try {
                // Fetch ALL documents including soft-deleted ones
                const documents = await LocalModel.find({}).lean();
                console.log(`   Found ${documents.length} documents (including deleted)`);

                for (const doc of documents) {
                    // Handle nested fields (e.g., shop.imageUrl in Settings)
                    let imageFilename;
                    if (config.nested && config.imageField.includes('.')) {
                        const parts = config.imageField.split('.');
                        imageFilename = doc[parts[0]]?.[parts[1]];
                    } else {
                        imageFilename = doc[config.imageField];
                    }
                    
                    const cloudinaryPublicId = config.publicIdField ? doc[config.publicIdField] : null;

                    // Skip if no image data at all
                    if (!imageFilename && !cloudinaryPublicId) {
                        continue;
                    }

                    // Extract just the filename if it's a path
                    if (imageFilename) {
                        imageFilename = path.basename(imageFilename);
                    }

                    // ALWAYS protect Settings shop images from deletion
                    if (modelName === 'Settings' && imageFilename) {
                        allValidImages.add(imageFilename);
                        console.log(`   🛡️  Protected Settings shop image: ${imageFilename}`);
                    }

                    // CASE 1: Has local filename, missing Cloudinary ID → Upload to Cloudinary
                    if (imageFilename && !cloudinaryPublicId && config.publicIdField) {
                        const result = await uploadImageToCloudinary(
                            LocalModel,
                            doc._id,
                            imageFilename,
                            config.imageField,
                            config.publicIdField
                        );
                        if (result.success) {
                            stats.uploadedToCloudinary++;
                            allValidImages.add(imageFilename);
                        } else {
                            stats.errors.push(`Upload failed for ${modelName}:${doc._id} - ${result.error}`);
                        }
                    }
                    // CASE 2: Has Cloudinary ID, missing local file → Download from Cloudinary
                    else if (cloudinaryPublicId && imageFilename) {
                        const localPath = path.join(uploadDir, imageFilename);
                        if (!fs.existsSync(localPath)) {
                            const result = await downloadImageFromCloudinary(
                                cloudinaryPublicId,
                                imageFilename
                            );
                            if (result.success) {
                                stats.downloadedToLocal++;
                                allValidImages.add(imageFilename);
                            } else {
                                stats.errors.push(`Download failed for ${modelName}:${doc._id} - ${result.error}`);
                            }
                        } else {
                            allValidImages.add(imageFilename);
                        }
                    }
                    // CASE 3: Has both or just local → Track as valid
                    else if (imageFilename) {
                        allValidImages.add(imageFilename);
                    }
                }
            } catch (error) {
                console.error(`❌ Error processing model ${modelName}:`, error.message);
                stats.errors.push(`Model ${modelName}: ${error.message}`);
            }
        }

        // CASE 3: Clean up orphaned images
        const orphanedResult = await cleanupOrphanedImages(allValidImages);
        stats.orphanedDeleted = orphanedResult.deleted;
        stats.errors.push(...orphanedResult.errors);

        console.log('\n✅ === IMAGE SYNC COMPLETED ===');
        console.log(`   📤 Uploaded to Cloudinary: ${stats.uploadedToCloudinary}`);
        console.log(`   📥 Downloaded to Local: ${stats.downloadedToLocal}`);
        console.log(`   🗑️  Orphaned Deleted: ${stats.orphanedDeleted}`);
        console.log(`   ❌ Errors: ${stats.errors.length}`);

        if (stats.errors.length > 0) {
            console.log('\n⚠️  Errors:');
            stats.errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
        }

        return {
            success: true,
            stats
        };

    } catch (error) {
        console.error('❌ Image sync failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Upload image to Cloudinary and update document
 */
async function uploadImageToCloudinary(Model, docId, imageFilename, imageField, publicIdField) {
    try {
        const localPath = path.join(uploadDir, imageFilename);

        // Check if local file exists
        if (!fs.existsSync(localPath)) {
            return { success: false, error: 'Local file not found' };
        }

        console.log(`   📤 Uploading ${imageFilename} to Cloudinary...`);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(localPath, {
            folder: 'ik-shop',
            public_id: `${Date.now()}-${path.parse(imageFilename).name}`,
            resource_type: 'image'
        });

        // Update document with Cloudinary public ID
        await Model.findByIdAndUpdate(docId, {
            [publicIdField]: result.public_id
        }); 

        console.log(`   ✅ Uploaded: ${result.public_id}`);
        return { success: true, publicId: result.public_id };

    } catch (error) {
        console.error(`   ❌ Upload failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Download image from Cloudinary to local storage
 */
async function downloadImageFromCloudinary(cloudinaryPublicId, filename) {
    try {
        console.log(`   📥 Downloading ${cloudinaryPublicId} from Cloudinary...`);

        // Get Cloudinary URL
        const cloudinaryUrl = cloudinary.url(cloudinaryPublicId, {
            secure: true,
            resource_type: 'image'
        });

        // Download image
        const response = await axios.get(cloudinaryUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        // Save to local filesystem
        const localPath = path.join(uploadDir, filename);
        fs.writeFileSync(localPath, response.data);

        console.log(`   ✅ Downloaded: ${filename}`);
        return { success: true };

    } catch (error) {
        console.error(`   ❌ Download failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Clean up orphaned images (images not referenced in any document)
 */
async function cleanupOrphanedImages(validImageSet) {
    console.log('\n🧹 Cleaning up orphaned images...');
    
    const stats = {
        deleted: 0,
        errors: []
    };

    try {
        if (!fs.existsSync(uploadDir)) {
            console.log('   ℹ️  Upload directory does not exist');
            return stats;
        }

        // Get all files in upload directory
        const allFiles = fs.readdirSync(uploadDir);
        console.log(`   Found ${allFiles.length} files in upload directory`);

        for (const filename of allFiles) {
            // Skip if this image is referenced in a document
            if (validImageSet.has(filename)) {
                continue;
            }

            // This is an orphaned image - delete it
            try {
                const filePath = path.join(uploadDir, filename);
                const fileStats = fs.statSync(filePath);

                // Only delete files (not directories)
                if (fileStats.isFile()) {
                    fs.unlinkSync(filePath);
                    stats.deleted++;
                    console.log(`   🗑️  Deleted orphaned: ${filename}`);
                }
            } catch (error) {
                stats.errors.push(`Failed to delete ${filename}: ${error.message}`);
            }
        }

        console.log(`   ✅ Deleted ${stats.deleted} orphaned images`);

    } catch (error) {
        console.error(`   ❌ Cleanup failed: ${error.message}`);
        stats.errors.push(`Cleanup error: ${error.message}`);
    }

    return stats;
}

/**
 * Helper: Get Cloudinary public ID from URL
 */
function extractPublicIdFromUrl(url) {
    try {
        const match = url.match(/\/v\d+\/(.+?)(?:\.|$)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Verify image exists in Cloudinary
 */
async function verifyCloudinaryImage(publicId) {
    try {
        const result = await cloudinary.api.resource(publicId);
        return { exists: true, url: result.secure_url };
    } catch (error) {
        return { exists: false };
    }
}
