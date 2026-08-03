import React, { createContext, useEffect, useState } from "react";
import api from "../services/api.js";
const AppPermissionContext = createContext()





const AppPermissionContextProvider = ({ children }) => {


    let [appPermissions, setAppPermissions] = useState([])




    useEffect(() => {
        try {
            (
                async function () {
                    let res = await api.get("/permissionRoutes/getDefaultPermissions")
                    let permissionArray = res.data.permissions

                    // Store as array instead of object for categorization
                    setAppPermissions(permissionArray)
                }
            )()
        } catch (error) {
            console.error(error?.message)
        }
    }, [])





    return (

        <AppPermissionContext.Provider value={{
            appPermissions
        }}>




            {children}

        </AppPermissionContext.Provider>
    )
}






export {
    AppPermissionContext,
    AppPermissionContextProvider
}





