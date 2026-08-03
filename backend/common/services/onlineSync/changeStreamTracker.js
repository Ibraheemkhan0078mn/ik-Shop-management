// ================= Change Stream Tracker =================

import { changeTrackDocsCreationFunc } from "./changeTrackModelCreation.js";

/**
 * Builds a map of collectionName -> modelName
 * so we can report the actual Mongoose model name (not the raw collection name).
 */
const buildCollectionModelMap = (connection) => {
    const map = new Map();
    connection.modelNames().forEach((modelName) => {
        const collectionName = connection.model(modelName).collection.name;
        map.set(collectionName, modelName);
    });
    return map;
};

/**
 * Logs a single change event in a clean, consistent format.
 */
const logChange = (modelName, operation, id, extra = {}) => {
    console.log("──────────────────────────────");
    console.log(`📦 Model     : ${modelName}`);
    console.log(`⚙️  Operation : ${operation}`);
    console.log(`🆔 _id       : ${id}`);
    if (Object.keys(extra).length) console.log("📝 Details   :", extra);
    console.log("──────────────────────────────");
};

/**
 * Starts a single DB-level change stream that tracks
 * create / update / delete across ALL registered models.
 * Stores changes in local MongoDB using changeTrackService.
 */
export const startChangeStreamTracking = (connection, resumeToken = null) => {
    const collectionModelMap = buildCollectionModelMap(connection);

    const changeStream = connection.watch([], {
        fullDocument: "updateLookup",
        ...(resumeToken ? { resumeAfter: resumeToken } : {}),
    });

    changeStream.on("change", async (change) => {
        const modelName = collectionModelMap.get(change.ns.coll) || change.ns.coll;
        const id = change.documentKey?._id;
        let operation = null;

        switch (change.operationType) {
            case "insert":
                operation = "create";
                logChange(modelName, "CREATE", id, { document: change.fullDocument });
                break;

            case "update":
                operation = "update";
                logChange(modelName, "UPDATE", id, {
                    updatedFields: change.updateDescription?.updatedFields,
                    removedFields: change.updateDescription?.removedFields,
                });
                break;

            case "replace":
                operation = "update";
                logChange(modelName, "UPDATE", id, { document: change.fullDocument });
                break;

            case "delete":
                operation = "delete";
                logChange(modelName, "DELETE", id);
                break;

            default:
                operation = change.operationType;
                logChange(modelName, change.operationType.toUpperCase(), id);
        }

        // Store the change in local MongoDB using changeTrackService
        if (operation && id && modelName) {
            try {
                await changeTrackDocsCreationFunc(operation, modelName, id.toString(), null);
            } catch (error) {
                console.error("[changeStreamTracker] Error storing change track:", error);
            }
        }

        // store token for reconnect-after-crash resilience
        lastResumeToken = change._id;
    });

    changeStream.on("error", (err) => {
        console.error("Change stream error, restarting in 2s:", err.message);
        changeStream.close();
        setTimeout(() => startChangeStreamTracking(connection, lastResumeToken), 2000);
    });

    process.on("SIGINT", async () => {
        await changeStream.close();
        process.exit(0);
    });

    console.log("👀 Change stream tracking started for all models.");
};

let lastResumeToken = null;