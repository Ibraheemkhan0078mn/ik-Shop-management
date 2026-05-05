





export async function permissionChangedDeletionFromLocal(modelArray, loggedInUserData) {
    try {

        let userPermissions = loggedInUserData?.permissions

        for (let eachModelCollection of modelArray) {
            if (userPermissions && userPermissions?.length > 0) {




                // when not admin. Then he need only his own data in this local storage. so delete other when not admin
                if (eachModelCollection.local.modelName == "user" && loggedInUserData.role != "admin") {
                    await eachModelCollection?.local?.deleteMany({ _id: { $ne: loggedInUserData?._id } })
                }


                // every model in my database have some permission string and when this permission string is with user then he allowed otherwise it delete the entire model collection from the local db
                let permissionCheckresult = eachModelCollection.permissionString.some(permission => userPermissions?.includes(permission))
                if (!permissionCheckresult &&
                    loggedInUserData?.role != "admin" &&
                    eachModelCollection.local.modelName != "user"
                ) {
                    await eachModelCollection?.local?.collection?.drop()
                }





                // when loop is running for class then it delete the classes also from local which are not permitted to user. means permistion is changed and new permition these classes are nto allowed
                let allowedClasses = loggedInUserData?.allowedClases
                if (loggedInUserData && eachModelCollection?.local?.modelName == "class") {
                    if (allowedClasses?.length > 0 && !(loggedInUserData?.role == "admin")) {
                        await eachModelCollection?.local?.deleteMany({
                            _id: { $nin: allowedClasses }
                        });
                    }
                }





                // students related with allowed class only remained other is deleted when class permition is changed by admin.
                if (loggedInUserData && eachModelCollection?.local?.modelName == "student") {
                    if (allowedClasses?.length > 0 && loggedInUserData?.role != "admin") {
                        await eachModelCollection?.local?.deleteMany({
                            classId: { $nin: allowedClasses }
                        });
                    }
                }




            }
        }


    } catch (error) {
        throw new Error(error?.message)
    }
}