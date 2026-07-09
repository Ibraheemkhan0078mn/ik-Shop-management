import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";
import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";


export async function getOnlineCtDocs(operation, requiredValuesObj) {
    try {
        let onlineChangeTrackModel = getOnlineChangeTrackModel();

        const filter = (operation && operation !== "all")
            ? { operationType: operation }
            : {};

        const projection = (requiredValuesObj && Object.keys(requiredValuesObj).length > 0)
            ? requiredValuesObj
            : {};

        const data = await onlineChangeTrackModel
            .find(filter, projection)
            .lean();

        return data;
    } catch (error) {
        throw new Error(error?.message || error?.stack)
    }
}






export async function getLocalCtDocs(operation, requiredValuesObj) {
    try {
        let localChangeTrackModel = getLocalChangeTrackModel();

        const filter = (operation && operation !== "all")
            ? { operationType: operation }
            : {};

        const projection = (requiredValuesObj && Object.keys(requiredValuesObj).length > 0)
            ? requiredValuesObj
            : {};

        const data = await localChangeTrackModel
            .find(filter, projection)
            .lean();

        return data;
    } catch (error) {
        throw new Error(error?.message || error?.stack)
    }
}