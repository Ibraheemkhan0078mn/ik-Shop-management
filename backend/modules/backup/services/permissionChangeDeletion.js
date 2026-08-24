





export async function permissionChangedDeletionFromLocal(modelArray, loggedInUserData) {
    try {
        // 1: If loggedinUserData is admin then return and do nothing
        if (loggedInUserData?.role === "admin") {
            return;
        }

        let userPermissions = loggedInUserData?.permissions;

        for (let eachModelCollection of modelArray) {
            if (eachModelCollection.syncAlways) {
                continue;
            }

            // 2: When not admin, in local instead of his data on this _id, delete all the user from this local
            if (eachModelCollection.local.modelName === "user") {
                await eachModelCollection?.local?.deleteMany({ _id: { $ne: loggedInUserData?._id } });
                continue;
            }

            // 3: Check its permission string and which permission is not given to him then delete the document of this model
            // and remains only document of models which permission is given to this user
            let permissionCheckResult = eachModelCollection.permissionString.some(permission => userPermissions?.includes(permission));
            if (!permissionCheckResult) {
                await eachModelCollection?.local?.deleteMany({});
            }
        }
    } catch (error) {
        throw new Error(error?.message);
    }
}