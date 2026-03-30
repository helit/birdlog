import { SPECIES_BY_SCIENTIFIC_NAME } from "@/graphql/queries";
import { fromSpeciesSlug, proxyImageUrl } from "@/lib/utils";
import { useQuery } from "@apollo/client";
import { ArrowLeftIcon, BirdIcon, PlusIcon } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LoadingScreen from "@/components/LoadingScreen";
import RarityBadge from "@/components/RarityBadge";
import { useEffect, useState } from "react";

const BirdInfoPage = () => {
  const navigate = useNavigate();
  const { scientificName } = useParams();
  const { state } = useLocation();
  const decodedName = fromSpeciesSlug(scientificName ?? "");
  const vernacularName: string | undefined = state?.vernacularName;

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // No coords = rarity badge won't show, which is acceptable
      },
    );
  }, []);

  const { data, loading, error } = useQuery(SPECIES_BY_SCIENTIFIC_NAME, {
    variables: { scientificName: decodedName, vernacularName },
    skip: !decodedName,
  });

  const species = data?.speciesByScientificName;

  if (loading) return <LoadingScreen />;

  if (error || !species) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Art hittades inte.</p>
        <Button variant="link" onClick={() => navigate(-1)}>
          Tillbaka
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeftIcon className="size-4" />
        Tillbaka
      </button>

      <div className="flex items-center gap-4">
        <div className="size-20 flex-shrink-0 overflow-hidden rounded-xl bg-primary/10">
          {species.imageUrl ? (
            <img
              src={proxyImageUrl(species.imageUrl) ?? undefined}
              alt={species.swedishName}
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`${species.imageUrl ? "hidden" : ""} flex size-full items-center justify-center`}
          >
            <BirdIcon className="size-8 text-primary/40" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{species.swedishName}</h1>
          <p className="text-sm italic text-muted-foreground">
            {species.scientificName}
          </p>
        </div>
      </div>

      {species.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {species.description}
        </p>
      )}

      {coords && (
        <RarityBadge
          scientificName={species.scientificName}
          latitude={coords.lat}
          longitude={coords.lng}
        />
      )}

      {species.family && (
        <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Familj</span>
            <span className="text-sm font-medium">{species.family}</span>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        onClick={() =>
          navigate("/new", {
            state: {
              prefill: {
                speciesId: species.id,
                swedishName: species.swedishName,
              },
            },
          })
        }
      >
        <PlusIcon className="mr-2 size-4" />
        Spara som observation
      </Button>
    </div>
  );
};

export default BirdInfoPage;
