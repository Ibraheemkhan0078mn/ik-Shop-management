import { getLocalDeviceIdentityModel } from "../../db/localDbConnection.js";
// import { ApiError } from "./response.js";







export async function deviceIdentityCheckFunction() {
    try {



        let deviceIdentityModel = getLocalDeviceIdentityModel()
        let deviceId;
        let appVersion = null;
        let existingDeviceIdentity = await deviceIdentityModel.find()
        if (existingDeviceIdentity?.length > 0) {
            deviceId = existingDeviceIdentity[0].deviceId
            appVersion = existingDeviceIdentity[0].localAppVersion
        } else {
            const timestamp = Date.now();          // current time
            const random = Math.random().toString(36).substring(2, 10); // random string
            const salt = "ibrahim_secret_salt";    // your custom fixed word

            // Combine all together
            const base = `${timestamp}-${random}-${salt}`;

            // Create a small hash-like string
            let hash = 0;
            for (let i = 0; i < base.length; i++) {
                hash = (hash << 5) - hash + base.charCodeAt(i);
                hash |= 0; // Convert to 32-bit integer
            }

            // Final unique string
            let randomUniqueKey = "ID-" + Math.abs(hash).toString(36) + "-" + random;


            let createdDeviceIdentity = await deviceIdentityModel.create({ deviceId: randomUniqueKey })
            deviceId = createdDeviceIdentity.deviceId
        }


        return { deviceId: deviceId || null, appVersion: appVersion }

    } catch (error) {
        console.error("Get Categories Error:", error);
        return { success: false, msg: error?.message }
    }
}