import { MyLifeList } from "@/utils/types";
import { useNavigate } from "react-router-dom";

interface LifeListCardProps {
  lifeList: MyLifeList;
}

const LifeListCard = ({ lifeList }: LifeListCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent"
      onClick={() => navigate(`/life-list/${lifeList.species.id}`, { state: { lifeList } })}
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium">{lifeList.species.swedishName}</div>
        <div className="text-xs text-muted-foreground italic">{lifeList.species.scientificName}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{lifeList.sightingCount} observationer</span>
        </div>
      </div>
    </button>
  );
};

export default LifeListCard;
