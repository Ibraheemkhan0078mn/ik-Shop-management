// components/PermissionGuard.js
// import { useContext } from 'react';
import { AppPermissionContext } from '../../context/Permission.context';
import { useSelector } from 'react-redux';
export const PermissionGuard = ({ permission, children, fallback = null }) => {

    // let {appPermissions}= useContext(AppPermissionContext)
    // let loggedInUserData = useSelector(state => state.user.loggedInUserData)
    // let userPermission = loggedInUserData.permissions || []


    // if (userPermission.includes(permission) || loggedInUserData.role == "admin") {
    return children;
    // }
    // return fallback;

};