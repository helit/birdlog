import { MyLifeList, SightingBySpecies } from "@/utils/types";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeftIcon, MapPinIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@apollo/client";
import { MY_SIGHTINGS_BY_SPECIES } from "@/graphql/queries";
import { Spinner } from "@/components/ui/spinner";
import SightingMap from "@/components/SightingMap";

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

  const { data, loading } = useQuery(MY_SIGHTINGS_BY_SPECIES, {
    variables: { speciesId: lifeList?.species.id },
    skip: !lifeList,
  });

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

      {data?.mySightingsBySpecies.length > 0 && (
        <SightingMap
          markers={data.mySightingsBySpecies.map((s: SightingBySpecies) => ({
            lat: s.latitude,
            lng: s.longitude,
            label: s.location || format(s.date, "d MMMM yyyy", { locale: sv }),
          }))}
        />
      )}

      {loading ? (
        <Spinner />
      ) : data?.mySightingsBySpecies.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Observationer</h2>
          {data.mySightingsBySpecies.map((sighting: SightingBySpecies) => (
            <div key={sighting.id} className="flex flex-col gap-1 rounded-lg bg-card p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {format(sighting.date, "d MMMM yyyy", { locale: sv })}
                </span>
                {sighting.location && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPinIcon className="size-3" />
                    {sighting.location}
                  </span>
                )}
              </div>
              {sighting.notes && <p className="text-sm text-muted-foreground">{sighting.notes}</p>}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default LifeListDetailPage;
