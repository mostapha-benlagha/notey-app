import { ArrowLeft, FolderSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { NoteyLogoMark } from "@/components/brand/NoteyLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProjectPageNotFound({ onBrowse }: { onBrowse: () => void }) {
  return (
    <Card className="flex h-full min-h-[420px] items-center justify-center rounded-[32px]">
      <CardContent className="max-w-xl p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-accent text-accent-foreground shadow-soft">
          <FolderSearch className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Project not found</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          This project link does not match anything in your workspace. It may have been removed or the URL may be incomplete.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="ghost" className="rounded-2xl">
            <Link to="/app">
              <ArrowLeft className="h-4 w-4" />
              Back to chat
            </Link>
          </Button>
          <Button className="rounded-2xl" onClick={onBrowse}>
            <NoteyLogoMark className="h-4 w-auto" aria-hidden />
            Browse active projects
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
