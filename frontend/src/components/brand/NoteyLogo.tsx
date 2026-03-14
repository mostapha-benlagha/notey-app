import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const ICON_PATH = "/icons/notey-app-icon.svg";
const LOGO_MARK_PATH = "/icons/notey-logo-without-name.svg";
const LOGO_FULL_PATH = "/icons/notey-logo-with-name.svg";

export function NoteyAppIcon({
  className,
  alt = "Notey",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={ICON_PATH}
      alt={alt}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

export function NoteyLogoMark({
  className,
  alt = "Notey",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={LOGO_MARK_PATH}
      alt={alt}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

export function NoteyLogoFull({
  className,
  alt = "Notey",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={LOGO_FULL_PATH}
      alt={alt}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
