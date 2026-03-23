import { proxyImageUrl } from "@/lib/utils";
import { Sighting } from "@/utils/types";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { BirdIcon, MapPinIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SightingCardProps {
  sighting: Sighting;
}

const SightingCard = ({ sighting }: SightingCardProps) => {
  const navigate = useNavigate();

  const imageUrl = sighting.species.imageUrl;

  return (
    <button
      className="flex w-full items-center gap-3 border-b border-border/50 px-3 py-2 text-left last:border-b-0"
      onClick={() => navigate(`/sighting/${sighting.id}`, { state: { sighting } })}
    >
      <div className="size-12 flex-shrink-0 overflow-hidden rounded-lg bg-primary/10">
        {imageUrl ? (
          <img
            src={proxyImageUrl(imageUrl) ?? undefined}
            alt={sighting.species.swedishName}
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
        <p className="truncate font-medium leading-tight">{sighting.species.swedishName}</p>
        <p className="truncate text-xs italic text-muted-foreground">
          {sighting.species.scientificName}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end text-right">
        <p className="text-xs text-muted-foreground">
          {format(sighting.date, "d MMM", { locale: sv })}
        </p>
        {sighting.location && (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPinIcon className="size-2.5" />
            <span className="max-w-[80px] truncate">{sighting.location}</span>
          </p>
        )}
      </div>
    </button>
  );
};

export default SightingCard;
