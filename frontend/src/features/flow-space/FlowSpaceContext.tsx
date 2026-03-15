import { createContext, useContext, type ReactNode } from "react";
import { useFlowSpace } from "@/features/flow-space/useFlowSpace";

type FlowSpaceValue = ReturnType<typeof useFlowSpace>;

const FlowSpaceContext = createContext<FlowSpaceValue | null>(null);

export function FlowSpaceProvider({ children, value }: { children: ReactNode; value: FlowSpaceValue }) {
  return <FlowSpaceContext.Provider value={value}>{children}</FlowSpaceContext.Provider>;
}

export function useFlowSpaceContext() {
  const value = useContext(FlowSpaceContext);
  if (!value) {
    throw new Error("useFlowSpaceContext must be used inside FlowSpaceProvider");
  }

  return value;
}
