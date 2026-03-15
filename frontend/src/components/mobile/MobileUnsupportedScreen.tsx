import { Download, Smartphone } from "lucide-react";
import { NoteyLogoFull } from "@/components/brand/NoteyLogo";
import { Button } from "@/components/ui/button";

export function MobileUnsupportedScreen() {
  return (
    <div className="min-h-dvh bg-background px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-xl items-center justify-center">
        <div className="w-full rounded-[36px] border border-white/80 bg-white/88 p-6 shadow-soft backdrop-blur md:p-8">
          <div className="flex items-center gap-3">
            <NoteyLogoFull className="h-10 w-auto" aria-hidden />
          </div>
          <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
            <Smartphone className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            This application is designed for web view only.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            If you want to use Notey on mobile, try to download our application instead. The full workspace is not supported on mobile browsers right now.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button
              asChild
              size="lg"
              className="rounded-2xl"
            >
              <a href="#" onClick={(event) => event.preventDefault()} aria-label="Download Notey for iOS">
                <Download className="h-4 w-4" />
                Download for iOS
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-2xl"
            >
              <a href="#" onClick={(event) => event.preventDefault()} aria-label="Download Notey for Android">
                <Download className="h-4 w-4" />
                Download for Android
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
