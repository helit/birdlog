import { MyLifeList } from "@/utils/types";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeftIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LifeListDetailPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const lifeList: MyLifeList | undefined = state?.lifeList;

  const getMonths = (months: number[]) => {
    return months
      .sort((a, b) => a - b)
      .map((m) => format(new Date(2000, m - 1), "MMMM", { locale: sv }))
      .join(", ");
  };

  if (!lifeList) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Art hittades inte.</p>
        <Button variant="link" onClick={() => navigate("/life-list")}>
          Tillbaka
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/life-list")}
      >
        <ArrowLeftIcon className="size-4" />
        Tillbaka
      </button>

      <div>
        <h1 className="text-2xl font-bold">{lifeList.species.swedishName}</h1>
        <p className="text-sm text-muted-foreground italic">{lifeList.species.scientificName}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Antal observationer</span>
          <span className="text-sm font-medium">{lifeList.sightingCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Först sedd</span>
          <span className="text-sm font-medium">
            {format(lifeList.firstSeenAt, "d MMMM yyyy", { locale: sv })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Senast sedd</span>
          <span className="text-sm font-medium">
            {format(lifeList.lastSeenAt, "d MMMM yyyy", { locale: sv })}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Månader</span>
          <p className="text-sm capitalize">{getMonths(lifeList.months)}</p>
        </div>
      </div>

      {/* TODO: Map with all sighting pins for this species */}
      <div className="flex h-48 items-center justify-center rounded-lg bg-muted shadow-sm text-sm text-muted-foreground">
        Karta kommer här
      </div>

      {/* TODO: List of individual sightings using mySightingsBySpecies query */}
    </div>
  );
};

export default LifeListDetailPage;
