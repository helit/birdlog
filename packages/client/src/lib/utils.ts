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

export function getIdentifyErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  switch (code) {
    case "rate_limit":
      return "AI-tjänsten är överbelastad just nu. Försök igen om en stund.";
    case "ai_unavailable":
      return "AI-tjänsten är inte tillgänglig just nu. Försök igen senare.";
    case "timeout":
      return "Anslutningen tog för lång tid. Kontrollera din internetanslutning och försök igen.";
    default:
      return "Kunde inte identifiera fågeln. Försök igen.";
  }
}
