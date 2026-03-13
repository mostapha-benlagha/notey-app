import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getDefaultAppRoute } from "@/utils/routes";

export function OnboardingRoute() {
  const user = useAuthStore((state) => state.user);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  if (isHydrating) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.onboardingCompleted) {
    return <Navigate to={getDefaultAppRoute()} replace />;
  }

  return <Outlet />;
}
