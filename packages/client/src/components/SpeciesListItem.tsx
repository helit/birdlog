import { proxyImageUrl } from "@/lib/utils";
import { BirdIcon } from "lucide-react";
import { ReactNode } from "react";

interface SpeciesListItemProps {
  imageUrl: string | null | undefined;
  swedishName: string;
  scientificName: string;
  onClick: () => void;
  children: ReactNode;
}

const SpeciesListItem = ({
  imageUrl,
  swedishName,
  scientificName,
  onClick,
  children,
}: SpeciesListItemProps) => {
  return (
    <button
      className="flex w-full items-center gap-3 border-b border-border/50 px-3 py-2 text-left last:border-b-0"
      onClick={onClick}
    >
      <div className="size-12 flex-shrink-0 overflow-hidden rounded-lg bg-primary/10">
        {imageUrl ? (
          <img
            src={proxyImageUrl(imageUrl) ?? undefined}
            alt={swedishName}
            className="size-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`${imageUrl ? "hidden" : ""} flex size-full items-center justify-center`}
        >
          <BirdIcon className="size-5 text-primary/40" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{swedishName}</p>
        <p className="truncate text-xs italic text-muted-foreground">
          {scientificName}
        </p>
      </div>
      {children}
    </button>
  );
};

export default SpeciesListItem;
