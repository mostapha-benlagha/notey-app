import "@xyflow/react/dist/style.css";
import { FlowSpaceProvider } from "@/features/flow-space/FlowSpaceContext";
import { FlowCreateDialog } from "@/features/flow-space/components/FlowCreateDialog";
import { FlowFiltersDialog } from "@/features/flow-space/components/FlowFiltersDialog";
import { FlowWorkspaceCard } from "@/features/flow-space/components/FlowWorkspaceCard";
import { useFlowSpace } from "@/features/flow-space/useFlowSpace";

export function FlowPage() {
  const flowSpace = useFlowSpace();

  return (
    <FlowSpaceProvider value={flowSpace}>
      <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
        <FlowWorkspaceCard />
        <FlowCreateDialog />
        <FlowFiltersDialog />
      </div>
    </FlowSpaceProvider>
  );
}
