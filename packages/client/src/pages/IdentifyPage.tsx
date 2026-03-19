import { Skeleton } from "@/components/ui/skeleton";
import { NEARBY_BIRDS } from "@/graphql/queries";
import { useQuery } from "@apollo/client";
import { BirdIcon, CameraIcon, PlusIcon, WandSparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface NearbyBird {
  scientificName: string;
  vernacularName: string;
  imageUrl: string | null;
  observationCount: number;
}

const HeroSkeleton = () => (
  <div className="flex h-32 items-center overflow-hidden rounded-xl bg-card shadow-sm">
    <Skeleton className="h-full w-28 flex-shrink-0 rounded-none" />
    <div className="flex flex-1 flex-col gap-2 px-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

const ListSkeleton = () => (
  <ul>
    {Array.from({ length: 5 }).map((_, i) => (
      <li
        key={i}
        className="flex items-center gap-3 border-b border-border/50 px-3 py-2 last:border-b-0"
      >
        <Skeleton className="size-12 flex-shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-2.5 w-6" />
        </div>
      </li>
    ))}
  </ul>
);

const IdentifyPage = () => {
  const navigate = useNavigate();

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const { data, loading } = useQuery(NEARBY_BIRDS, {
    variables: { latitude, longitude },
    skip: !latitude,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
    });
  }, []);

  const allCommon: NearbyBird[] = data?.nearbyBirds?.common ?? [];
  const rareBird: NearbyBird | null = data?.nearbyBirds?.rare ?? null;

  // When no rare bird, #1 common is used as hero — show the rest in the list
  const hero = rareBird ?? allCommon[0] ?? null;
  const birds = rareBird ? allCommon.slice(0, 5) : allCommon.slice(1, 6);

  const isLoading = loading || !latitude;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero card */}
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        hero &&
        (() => {
          const isRare = !!rareBird;
          return (
            <div className="relative overflow-hidden rounded-xl shadow-sm">
              <div
                className={`flex h-32 items-center ${isRare ? "bg-amber-50" : "bg-primary/5"}`}
              >
                {hero.imageUrl ? (
                  <img
                    src={hero.imageUrl}
                    alt={hero.vernacularName}
                    className="h-full w-28 flex-shrink-0 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`${hero.imageUrl ? "hidden" : ""} flex h-full w-28 flex-shrink-0 items-center justify-center ${isRare ? "bg-amber-100" : "bg-primary/10"}`}
                >
                  <BirdIcon
                    className={`size-6 ${isRare ? "text-amber-600" : "text-primary"}`}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 px-4">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${isRare ? "text-amber-700" : "text-primary"}`}
                  >
                    {isRare ? "Ovanlig observation" : "Mest observerad just nu"}
                  </p>
                  <p className="font-medium capitalize leading-tight">{hero.vernacularName}</p>
                  <p className="text-xs italic text-muted-foreground">{hero.scientificName}</p>
                  <p className="text-xs text-muted-foreground">
                    {hero.observationCount} obs denna månad
                  </p>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Common birds list */}
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Fåglar nära dig
        </h2>
        <div className="overflow-hidden rounded-xl bg-card shadow-sm">
          {isLoading ? (
            <ListSkeleton />
          ) : birds.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-muted-foreground">Inga fåglar hittades i närheten</p>
            </div>
          ) : (
            <ul>
              {birds.map((bird) => (
                <li
                  key={bird.scientificName}
                  className="flex items-center gap-3 border-b border-border/50 px-3 py-2 last:border-b-0"
                >
                  <div className="size-12 flex-shrink-0 overflow-hidden rounded-lg bg-primary/10">
                    {bird.imageUrl ? (
                      <img
                        src={bird.imageUrl}
                        alt={bird.vernacularName}
                        className="size-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`${bird.imageUrl ? "hidden" : ""} flex size-full items-center justify-center`}>
                      <BirdIcon className="size-5 text-primary/40" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium capitalize leading-tight">
                      {bird.vernacularName}
                    </p>
                    <p className="truncate text-xs italic text-muted-foreground">
                      {bird.scientificName}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-semibold text-primary">{bird.observationCount}</p>
                    <p className="text-[10px] text-muted-foreground">obs</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <button
          className="flex size-14 items-center justify-center rounded-full bg-card shadow-sm active:scale-95"
          onClick={() => navigate("/identify/guided")}
        >
          <WandSparklesIcon className="size-6 text-primary" />
        </button>
        <button
          className="flex size-14 items-center justify-center rounded-full bg-primary shadow-sm active:scale-95"
          onClick={() => navigate("/new")}
        >
          <PlusIcon className="size-6 text-primary-foreground" />
        </button>
        <button
          className="flex size-14 items-center justify-center rounded-full bg-card shadow-sm active:scale-95"
          onClick={() => navigate("/identify/photo")}
        >
          <CameraIcon className="size-6 text-primary" />
        </button>
      </div>
    </div>
  );
};

export default IdentifyPage;
