import { Sighting } from "@/utils/types";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { MapPinIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SpeciesListItem from "./SpeciesListItem";

interface SightingCardProps {
  sighting: Sighting;
}

const SightingCard = ({ sighting }: SightingCardProps) => {
  const navigate = useNavigate();

  return (
    <SpeciesListItem
      imageUrl={sighting.species.imageUrl}
      swedishName={sighting.species.swedishName}
      scientificName={sighting.species.scientificName}
      onClick={() => navigate(`/sighting/${sighting.id}`, { state: { sighting } })}
    >
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
    </SpeciesListItem>
  );
};

export default SightingCard;
