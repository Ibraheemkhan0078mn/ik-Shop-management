import { getOnlineAppVersionModel } from "../db/onlineDbConnection.js"




export async function versionCheckFunction(role = "staff") {
    try {

        if (role != "admin") {
            let onlineDesktopAppVersionModel = getOnlineAppVersionModel()

            let versionDocs = await onlineDesktopAppVersionModel.find()
            if (versionDocs?.length > 0) {
                let firstVerDoc = versionDocs[0]
                if (firstVerDoc?.version != "v1") {
                    return { success: false, msg: "Your Desktop Application Version is not correct." }
                } else {
                    return { success: true, msg: "The version is correct." }
                }
            } else {
                return ({ success: false, msg: "The version in online database is not found" })
            }
        } else {
            return ({ success: true, msg: "The role is admin so no version check happens." })
        }


    } catch (error) {
        return { success: false, msg: error?.message, stack: error?.stack }
    }
}