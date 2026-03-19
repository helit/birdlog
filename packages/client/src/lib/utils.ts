import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return `http://${window.location.hostname}:4000/api/image-proxy?url=${encodeURIComponent(url)}`;
}
