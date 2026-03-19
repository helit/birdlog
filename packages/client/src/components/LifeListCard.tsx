import { proxyImageUrl } from "@/lib/utils";
import { MyLifeList } from "@/utils/types";
import { BirdIcon } from "lucide-react";
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
      <div className="size-12 flex-shrink-0 overflow-hidden rounded-lg bg-primary/10">
        {lifeList.species.imageUrl ? (
          <img
            src={proxyImageUrl(lifeList.species.imageUrl) ?? undefined}
            alt={lifeList.species.swedishName}
            className="size-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`${lifeList.species.imageUrl ? "hidden" : ""} flex size-full items-center justify-center`}
        >
          <BirdIcon className="size-5 text-primary/40" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{lifeList.species.swedishName}</div>
        <div className="text-xs italic text-muted-foreground">
          {lifeList.species.scientificName}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{lifeList.sightingCount} observationer</span>
        </div>
      </div>
    </button>
  );
};

export default LifeListCard;
