import { Settings2 } from "lucide-react";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFlowSpaceContext } from "@/features/flow-space/FlowSpaceContext";

export function FlowWorkspaceCard() {
  const {
    activeFilterCount,
    dateRangeLabel,
    edges,
    filteredNotes,
    filteredProjects,
    filteredTasks,
    handleConnect,
    handleEdgesDelete,
    isLoading,
    nodes,
    onEdgesChange,
    onNodesChange,
    setFiltersOpen,
    showTodos,
  } = useFlowSpaceContext();

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px]">
      <CardHeader className="gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription>Flow workspace</CardDescription>
            <CardTitle className="text-3xl">Map projects, notes, and to-dos visually</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {dateRangeLabel}
            </div>
            <div className="inline-flex rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              {filteredProjects.length} projects
            </div>
            <div className="inline-flex rounded-full bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {filteredNotes.length} notes
            </div>
            <div className="inline-flex rounded-full bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              {showTodos ? filteredTasks.length : 0} to-dos
            </div>
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setFiltersOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        <div className="relative h-full min-h-[560px] bg-[radial-gradient(circle_at_top,rgba(22,99,199,0.07),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,252,0.96))]">
          {isLoading ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading projects, notes, and to-dos...</div> : null}
          {!isLoading && !nodes.length ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
              <div className="rounded-[28px] border border-dashed border-border bg-white/80 px-8 py-10 shadow-soft">
                <h2 className="text-lg font-semibold">Nothing matches these filters</h2>
                <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                  Expand the timeline, re-enable more projects or task statuses, or show to-dos again to bring items back into view.
                </p>
              </div>
            </div>
          ) : null}
          {!isLoading && nodes.length ? (
            <div className="absolute right-5 top-5 z-10 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-xs leading-6 text-muted-foreground shadow-soft backdrop-blur">
              Drag nodes to organize them.
              <br />
              Connect a note to a project to change its project.
              <br />
              Connect a to-do to a note to link it.
              <br />
              Select a task edge and press Delete to unlink it.
            </div>
          ) : null}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(connection) => {
              void handleConnect(connection);
            }}
            onEdgesDelete={(deletedEdges) => {
              void handleEdgesDelete(deletedEdges);
            }}
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick
            fitView={nodes.length > 0}
            fitViewOptions={{ padding: 0.18 }}
            nodesConnectable
            proOptions={{ hideAttribution: true }}
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background gap={20} size={1} color="#dbe4ef" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}
