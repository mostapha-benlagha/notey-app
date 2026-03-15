import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFlowSpaceContext } from "@/features/flow-space/FlowSpaceContext";
import type { TimelinePreset } from "@/features/flow-space/constants";

export function FlowFiltersDialog() {
  const {
    allProjectIds,
    allStatusIds,
    dateFrom,
    dateTo,
    filtersOpen,
    projects,
    resetFilters,
    selectedProjectIds,
    selectedStatusIds,
    setDateFrom,
    setDateTo,
    setFiltersOpen,
    setProjectFilter,
    setShowTodos,
    setStatusFilter,
    setTimelinePreset,
    showTodos,
    statuses,
    timelinePreset,
    toggleSelection,
  } = useFlowSpaceContext();

  return (
    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
      <DialogContent className="left-auto right-0 top-0 h-dvh max-h-dvh overflow-y-auto translate-x-0 translate-y-0 rounded-none border-y-0 border-r-0 border-l border-white/80 p-0 sm:max-w-[460px]">
        <div className="flex h-full flex-col bg-white/96">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle className="text-2xl">Flow filters</DialogTitle>
            <DialogDescription>
              Narrow the workspace without crowding the canvas. Adjust the timeline, visible projects, and task visibility here.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-6 px-6 py-6">
            <section className="grid gap-4 rounded-[24px] border border-border bg-secondary/25 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Timeline</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">Show only notes created inside this date range.</p>
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Range</span>
                <Select value={timelinePreset} onChange={(event) => setTimelinePreset(event.target.value as TimelinePreset)}>
                  <option value="today">Today</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="custom">Custom</option>
                </Select>
              </label>
              {timelinePreset === "custom" ? (
                <>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">From</span>
                    <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">To</span>
                    <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                  </label>
                </>
              ) : null}
            </section>

            <section className="grid gap-4 rounded-[24px] border border-border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Projects</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">Include only the projects you want to see in the graph.</p>
                </div>
                <button type="button" className="text-xs font-semibold text-primary" onClick={() => setProjectFilter(null)}>
                  Select all
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {projects.map((project) => {
                  const checked = selectedProjectIds.includes(project.id);
                  return (
                    <label key={project.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/35 px-3 py-2 text-sm text-foreground">
                      <Checkbox checked={checked} onChange={() => setProjectFilter((current) => toggleSelection(current, project.id, allProjectIds))} />
                      <span>{project.name}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 rounded-[24px] border border-border bg-white p-4">
              <div className="flex items-center justify-between gap-4 rounded-[20px] border border-border bg-secondary/25 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Show to-dos</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    Hide task nodes and links if you only want project and note relationships.
                  </p>
                </div>
                <Switch checked={showTodos} onCheckedChange={setShowTodos} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Task statuses</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">Filter which task columns appear in the graph.</p>
                </div>
                <button type="button" className="text-xs font-semibold text-primary" onClick={() => setStatusFilter(null)}>
                  Select all
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {statuses.map((status) => {
                  const checked = selectedStatusIds.includes(status.id);
                  return (
                    <label key={status.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/35 px-3 py-2 text-sm text-foreground">
                      <Checkbox
                        checked={checked}
                        onChange={() => setStatusFilter((current) => toggleSelection(current, status.id, allStatusIds))}
                        disabled={!showTodos}
                      />
                      <span>{status.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
            <button type="button" className="text-sm font-semibold text-muted-foreground" onClick={resetFilters}>
              Reset filters
            </button>
            <Button type="button" className="rounded-2xl" onClick={() => setFiltersOpen(false)}>
              Apply and close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
