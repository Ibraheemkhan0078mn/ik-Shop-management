import React from 'react'

const PermissionGuard = ({ permission, children, fallback = null }) => {
  if (permission) {
    return <>{children ?? fallback}</>;
  }

  return <>{children ?? fallback}</>;
};

export { PermissionGuard };
export default PermissionGuard;
