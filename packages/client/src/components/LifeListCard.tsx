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
      className="flex w-full items-center gap-3 border-b border-border/50 px-3 py-2 text-left last:border-b-0"
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
        <p className="truncate font-medium leading-tight">{lifeList.species.swedishName}</p>
        <p className="truncate text-xs italic text-muted-foreground">
          {lifeList.species.scientificName}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-primary">{lifeList.sightingCount}</p>
        <p className="text-[10px] text-muted-foreground">obs</p>
      </div>
    </button>
  );
};

export default LifeListCard;
