import { ChevronRightIcon } from "lucide-react";

interface GuidebookRowProps {
  swedishName: string | null;
  scientificName: string;
  onClick: () => void;
}

export function GuidebookRow({
  swedishName,
  scientificName,
  onClick,
}: GuidebookRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border/50 px-3 py-3 text-left last:border-b-0 active:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        {swedishName ? (
          <>
            <p className="truncate font-medium leading-tight">{swedishName}</p>
            <p className="truncate text-xs italic text-muted-foreground">
              {scientificName}
            </p>
          </>
        ) : (
          <p className="truncate font-medium italic leading-tight">
            {scientificName}
          </p>
        )}
      </div>
      <ChevronRightIcon
        className="h-4 w-4 flex-shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  );
}
