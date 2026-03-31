import { MyLifeList } from "@/utils/types";
import { useNavigate } from "react-router-dom";
import SpeciesListItem from "./SpeciesListItem";

interface LifeListCardProps {
  lifeList: MyLifeList;
}

const LifeListCard = ({ lifeList }: LifeListCardProps) => {
  const navigate = useNavigate();

  return (
    <SpeciesListItem
      imageUrl={lifeList.species.imageUrl}
      swedishName={lifeList.species.swedishName}
      scientificName={lifeList.species.scientificName}
      onClick={() => navigate(`/life-list/${lifeList.species.id}`, { state: { lifeList } })}
    >
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-primary">{lifeList.sightingCount}</p>
        <p className="text-[10px] text-muted-foreground">obs</p>
      </div>
    </SpeciesListItem>
  );
};

export default LifeListCard;
