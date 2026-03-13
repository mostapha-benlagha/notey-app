import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getDefaultAppRoute } from "@/utils/routes";

export function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  if (isHydrating) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultAppRoute()} replace />;
  }

  return <Outlet />;
}
