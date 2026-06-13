import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import TopBarProgress from "../components/shared/TopBarProgress";
import Unauthorized from "../pages/Unauthorized/Unauthorized";

type PermissionGuardProps = {
  module: string;
  required: string | string[];
  mode?: "all" | "any";
  children: React.ReactNode;
};

const hasPermission = (
  permissionsByModule: any,
  module: string,
  permissionKey: string
): boolean => {
  const modulePerms = permissionsByModule?.[module];
  if (!Array.isArray(modulePerms)) return false;
  return modulePerms.some((p: any) => p?.[permissionKey] === "1");
};

const PermissionGuard = ({
  module,
  required,
  mode = "all",
  children,
}: PermissionGuardProps) => {
  const permissionsState = useSelector((state: RootState) => state.permissions);
  const loading = !!permissionsState?.loading;
  const permissionsByModule = permissionsState?.permissions;

  if (loading) {
    return <TopBarProgress />;
  }

  const requiredList = Array.isArray(required) ? required : [required];
  const checks = requiredList.map((key) =>
    hasPermission(permissionsByModule, module, key)
  );
  const allowed = mode === "any" ? checks.some(Boolean) : checks.every(Boolean);

  if (!allowed) {
    return <Unauthorized />;
  }

  return <>{children}</>;
};

export default PermissionGuard;

