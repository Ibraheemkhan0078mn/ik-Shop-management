import { getActivityLogModel } from "../../db/localDbConnection.js";




async function createActivityLog(activityType, model,  documentId,  activityDescription, userId) {
    try {
        if (!activityType || !activityDescription) {
            return;
        }
        let localActivityLogModel = getActivityLogModel();
        await localActivityLogModel.create({
            action: activityType,
            documentId,
            relatedWith: model,
            description: activityDescription,
            performedBy: userId
        })

    } catch (error) {
    }
}