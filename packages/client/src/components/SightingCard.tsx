import { Sighting } from "@/utils/types";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { MapPinIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SightingCardProps {
  sighting: Sighting;
}

const SightingCard = ({ sighting }: SightingCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent"
      onClick={() => navigate(`/sighting/${sighting.id}`, { state: { sighting } })}
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium">{sighting.species.swedishName}</div>
        <div className="text-xs text-muted-foreground italic">{sighting.species.scientificName}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{format(sighting.date, "d MMM", { locale: sv })}</span>
          {sighting.location && (
            <>
              <MapPinIcon className="size-3" />
              <span className="truncate">{sighting.location}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export default SightingCard;
