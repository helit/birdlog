import { Skeleton } from "@/components/ui/skeleton";
import { NEARBY_BIRDS } from "@/graphql/queries";
import { proxyImageUrl, toSpeciesSlug } from "@/lib/utils";
import { useQuery } from "@apollo/client";
import { BirdIcon, CameraIcon, MapPinIcon, PlusIcon, RefreshCw, WandSparklesIcon } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

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
    {Array.from({ length: 3 }).map((_, i) => (
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

const BirdList = ({ birds, navigate }: { birds: NearbyBird[]; navigate: (path: string, opts?: object) => void }) => (
  <ul>
    {birds.map((bird) => (
      <li key={bird.scientificName}>
        <button
          className="flex w-full items-center gap-3 border-b border-border/50 px-3 py-2 text-left last:border-b-0 active:bg-muted/50"
          onClick={() =>
            navigate(`/bird/${toSpeciesSlug(bird.scientificName)}`, {
              state: { vernacularName: bird.vernacularName },
            })
          }
        >
          <div className="size-12 flex-shrink-0 overflow-hidden rounded-lg bg-primary/10">
            {bird.imageUrl ? (
              <img
                src={proxyImageUrl(bird.imageUrl) ?? undefined}
                alt={bird.vernacularName}
                className="size-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`${bird.imageUrl ? "hidden" : ""} flex size-full items-center justify-center`}
            >
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
        </button>
      </li>
    ))}
  </ul>
);

const IdentifyPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoErrorType, setGeoErrorType] = useState<'denied' | 'timeout' | null>(null);

  const { data, loading, error, refetch } = useQuery(NEARBY_BIRDS, {
    variables: { latitude, longitude },
    skip: !latitude,
  });

  const fetchLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      (err) => {
        setGeoErrorType(err.code === 1 ? 'denied' : 'timeout');
      },
      { timeout: 10000 },
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []); // run once on mount

  const handleRetry = () => {
    setLatitude(null);
    setLongitude(null);
    setGeoErrorType(null);
    fetchLocation();
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (fileInputRef.current) fileInputRef.current.value = "";
      navigate("/identify/photo", { state: { imageData: reader.result, latitude, longitude } });
    };
    reader.readAsDataURL(file);
  };

  const hero: NearbyBird | null = data?.nearbyBirds?.hero ?? null;
  const commonBirds: NearbyBird[] = data?.nearbyBirds?.common ?? [];
  const uncommonBirds: NearbyBird[] = data?.nearbyBirds?.uncommon ?? [];

  const isLoading = geoErrorType === null && !error && (loading || !latitude);

  return (
    <div className="flex min-h-[calc(100dvh-5rem-1rem)] flex-col gap-4">
      {/* Hero card — rarest bird in the area */}
      {isLoading ? (
        <HeroSkeleton />
      ) : hero ? (
        <button
          className="w-full overflow-hidden rounded-xl shadow-sm text-left active:scale-[0.98] transition-transform"
          onClick={() =>
            navigate(`/bird/${toSpeciesSlug(hero.scientificName)}`, {
              state: { vernacularName: hero.vernacularName },
            })
          }
        >
          <div className="flex h-32 items-center bg-amber-50">
            {hero.imageUrl ? (
              <img
                src={proxyImageUrl(hero.imageUrl) ?? undefined}
                alt={hero.vernacularName}
                className="h-full w-28 flex-shrink-0 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`${hero.imageUrl ? "hidden" : ""} flex h-full w-28 flex-shrink-0 items-center justify-center bg-amber-100`}
            >
              <BirdIcon className="size-6 text-amber-600" />
            </div>
            <div className="flex flex-1 flex-col gap-1 px-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Ovanligast nära dig
              </p>
              <p className="font-medium capitalize leading-tight">{hero.vernacularName}</p>
              <p className="text-xs italic text-muted-foreground">{hero.scientificName}</p>
              <p className="text-xs text-muted-foreground">
                {hero.observationCount} obs senaste 30 dagarna
              </p>
            </div>
          </div>
        </button>
      ) : geoErrorType === 'timeout' ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl bg-card shadow-sm">
          <MapPinIcon className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Kunde inte hämta din position</p>
          <button
            onClick={handleRetry}
            className="text-xs font-medium text-primary active:opacity-70"
          >
            Försök igen
          </button>
        </div>
      ) : geoErrorType === 'denied' ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl bg-card shadow-sm">
          <MapPinIcon className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Du måste tillåta platstjänster i din webbläsare</p>
        </div>
      ) : error ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl bg-card shadow-sm">
          <BirdIcon className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Kunde inte hämta fåglar nära dig</p>
        </div>
      ) : null}

      {/* Common birds */}
      {(isLoading || commonBirds.length > 0) && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Vanligast nära dig
            </h2>
            <button
              aria-label="Uppdatera fåglar nära dig"
              disabled={loading}
              onClick={() => refetch({ force: true })}
              className="flex items-center justify-center p-1 text-muted-foreground disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="overflow-hidden rounded-xl bg-card shadow-sm">
            {isLoading ? (
              <ListSkeleton />
            ) : (
              <BirdList birds={commonBirds} navigate={navigate} />
            )}
          </div>
        </div>
      )}

      {/* Uncommon birds */}
      {(isLoading || uncommonBirds.length > 0) && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ovanliga nära dig
          </h2>
          <div className="overflow-hidden rounded-xl bg-card shadow-sm">
            {isLoading ? (
              <ListSkeleton />
            ) : (
              <BirdList birds={uncommonBirds} navigate={navigate} />
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      <div className="mt-auto flex justify-center gap-6 pb-4">
        <button
          aria-label="Guidad identifiering"
          className="flex size-14 items-center justify-center rounded-full bg-card shadow-sm active:scale-95"
          onClick={() => navigate("/identify/guided", { state: { latitude, longitude } })}
        >
          <WandSparklesIcon className="size-6 text-primary" />
        </button>
        <button
          aria-label="Ny observation"
          className="flex size-14 items-center justify-center rounded-full bg-primary shadow-sm active:scale-95"
          onClick={() => navigate("/new")}
        >
          <PlusIcon className="size-6 text-primary-foreground" />
        </button>
        <button
          aria-label="Fotoidentifiering"
          className="flex size-14 items-center justify-center rounded-full bg-card shadow-sm active:scale-95"
          onClick={() => {
            if (fileInputRef.current) fileInputRef.current.value = "";
            fileInputRef.current?.click();
          }}
        >
          <CameraIcon className="size-6 text-primary" />
        </button>
      </div>
    </div>
  );
};

export default IdentifyPage;
