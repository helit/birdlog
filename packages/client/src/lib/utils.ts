import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toSpeciesSlug(scientificName: string): string {
  return scientificName.toLowerCase().replace(/\s+/g, "-");
}

export function fromSpeciesSlug(slug: string): string {
  return slug.replace(/-/g, " ");
}

export function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
