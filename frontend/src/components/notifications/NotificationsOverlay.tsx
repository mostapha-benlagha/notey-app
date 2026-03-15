import { Bell, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNotificationsStore } from "@/store/useNotificationsStore";

export function NotificationsOverlay() {
  const items = useNotificationsStore((state) => state.items);
  const dismiss = useNotificationsStore((state) => state.dismiss);
  const markNoteSeen = useNotificationsStore((state) => state.markNoteSeen);

  if (!items.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-50 flex w-full max-w-sm flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-soft backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-2xl">
                  <Link to={`/app/notes/${item.noteId}`} state={{ returnTo: "/app" }} onClick={() => markNoteSeen(item.noteId)}>
                    Check note
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-2xl"
                  onClick={() => dismiss(item.id)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
