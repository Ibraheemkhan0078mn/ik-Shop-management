

import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";


 

export async function permissionChangedDeletionFromLocal(modelArray, loggedInUserData) {
    try {

        let userPermissions = loggedInUserData?.permissions
        let allowedClasses = loggedInUserData?.allowedClases
        let deletePromises = []
        let localChangeTrackModel = getLocalChangeTrackModel()






        for (let eachModelCollection of modelArray) {

            if (userPermissions && userPermissions?.length > 0) {




                // when not admin. Then he need only his own data in this local storage. so delete other when not admin
                if (eachModelCollection.local.modelName == "user" && loggedInUserData.role != "admin") {
                    deletePromises.push(eachModelCollection?.local?.deleteMany({ _id: { $ne: loggedInUserData?._id } }))
                }


                // every model in my database have some permission string and when this permission string is with user then he allowed otherwise it delete the entire model collection from the local db
                // Admin should never have collections deleted regardless of permissions
                // Check admin role FIRST before any permission logic
                if (loggedInUserData?.role != "admin" && eachModelCollection.local.modelName != "user") {
                    let permissionCheckresult = eachModelCollection.permissionString.some(permission => userPermissions?.includes(permission))
                    if (!permissionCheckresult) {
                    try {
                        // First clean up CT records for this model to prevent ghost sync attempts
                        deletePromises.push(
                            localChangeTrackModel.deleteMany({ modelName: eachModelCollection.local.modelName })
                        )
                        // Then drop the collection
                        deletePromises.push(
                            eachModelCollection?.local?.collection?.drop().catch(() => { })  // ✅
                        )
                    } catch (e) {
                        // collection already nahi thi, koi masla nahi
                    }
                    }
                }





                // when loop is running for class then it delete the classes also from local which are not permitted to user. means permistion is changed and new permition these classes are nto allowed
                if (loggedInUserData && eachModelCollection?.local?.modelName == "class") {
                    if (loggedInUserData?.role != "admin") {
                        deletePromises.push(eachModelCollection?.local?.deleteMany({
                            _id: { $nin: allowedClasses || [] }
                        }))
                    }
                }





                // students related with allowed class only remained other is deleted when class permition is changed by admin.
                if (loggedInUserData && eachModelCollection?.local?.modelName == "student") {
                    if ( loggedInUserData?.role != "admin") {
                        deletePromises.push(eachModelCollection?.local?.deleteMany({
                            classId: { $nin: allowedClasses || []}
                        }))
                    }
                }




            }
        }



        await Promise.all(deletePromises)



    } catch (error) {
        throw new Error(error?.message)
    }
}