import { getLocalActivityLogModel } from "../../db/localDbConnection";




async function createActivityLog(activityType, model, documentId, activityDescription, userId) {
    try {
        if (!activityType || !activityDescription) {
            return;
        }
        let localActivityLogModel = getLocalActivityLogModel();
        await localActivityLogModel.create({
            action: activityType,
            documentId,
            relatedWith: model,
            description: activityDescription,
            performedBy: userId
        })

    } catch (error) {
        console.log("Error while creating activity log: ", error);
    }
}