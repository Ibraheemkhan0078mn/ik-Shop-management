








export async function notPermittedCleaning(modelsArray, loggedInUserData) {
    try {


        for (let eachCollectionObject of modelsArray) {


            // check if permittted then only running otherwise not intterate on another and again check and so on...
            let userPermissions = loggedInUserData?.permissions
            if (userPermissions && userPermissions?.length > 0) {
                if (!(userPermissions?.includes(eachCollectionObject.permissionString))) {
                    continue;
                }
            }


            // when loop is running for class then it delete the classes also from local which are not permitted to user. means permistion is changed and new permition these classes are nto allowed
            let allowedClasses = loggedInUserData?.allowedClases
            if (loggedInUserData && eachCollectionObject?.local?.modelName == "class") {
                if (allowedClasses?.length > 0 && !(loggedInUserData?.role == "admin")) {
                    await eachCollectionObject.local.deleteMany({
                        _id: { $nin: allowedClasses }
                    });
                }
            }





            // students related with allowed class only remained other is deleted when class permition is changed by admin.
            if (loggedInUserData && eachCollectionObject?.local?.modelName == "student") {
                if (allowedClasses?.length > 0 && loggedInUserData?.role != "admin") {
                    await eachCollectionObject.local.deleteMany({
                        classId: { $nin: allowedClasses }
                    });
                }
            }







        }

    } catch (error) {
        throw new Error(error)
    }
}