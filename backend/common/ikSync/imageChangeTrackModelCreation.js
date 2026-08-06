import { getLocalImageChangeTrackModel } from "../../configs/connect.db.js";

export async function imageChangeTrackDocsCreation(
    operation,
    modelName,
    documentId,
    cloudinaryPublicId
) {
    try {
        console.log(`[imageChangeTrackDocsCreation] Operation: ${operation}, Model: ${modelName}, Document: ${documentId}`);

        // Validate required parameters
        if (!operation || !modelName || !documentId) {
            console.warn("[imageChangeTrackDocsCreation] Missing required parameters");
            return;
        }

        let imageChangeTrackModel = getLocalImageChangeTrackModel()

        // For delete operations without cloudinaryPublicId, remove any existing tracking for this document
        // This happens when an image is replaced - we delete the old image tracking
        if ((operation == "delete") && (!cloudinaryPublicId)) {
            console.log(`[imageChangeTrackDocsCreation] Removing tracking for document ${documentId} (image replacement)`);
            await imageChangeTrackModel?.deleteMany({ documentId: documentId?.toString() })
            return;
        }

        // Create new tracking document
        let createdImageChangeTrackDocs = await imageChangeTrackModel.create({
            documentId,
            operationType: operation,
            modelName,
            cloudinaryPublicId: operation == "delete" && cloudinaryPublicId || null
        })

        console.log(`[imageChangeTrackDocsCreation] Created tracking document: ${createdImageChangeTrackDocs._id}`);

    } catch (error) {
        console.error("[imageChangeTrackDocsCreation] Error:", error);
    }
}
