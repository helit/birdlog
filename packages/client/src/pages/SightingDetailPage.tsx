import { Button } from "@/components/ui/button";
import { DELETE_SIGHTING } from "@/graphql/mutations";
import { MY_SIGHTINGS, MY_LIFE_LIST } from "@/graphql/queries";
import { Sighting } from "@/utils/types";
import { useMutation } from "@apollo/client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { proxyImageUrl } from "@/lib/utils";
import { ArrowLeftIcon, BirdIcon, MapPinIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import SightingMap from "@/components/SightingMap";

const SightingDetailPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const sighting: Sighting | undefined = state?.sighting;

  const [deleteSighting, { loading: deleting }] = useMutation(DELETE_SIGHTING, {
    refetchQueries: [{ query: MY_SIGHTINGS }, { query: MY_LIFE_LIST }],
    awaitRefetchQueries: true,
  });

  if (!sighting) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Observation hittades inte.</p>
        <Button variant="link" onClick={() => navigate("/")}>
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
          {sighting.species.imageUrl ? (
            <img
              src={proxyImageUrl(sighting.species.imageUrl) ?? undefined}
              alt={sighting.species.swedishName}
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`${sighting.species.imageUrl ? "hidden" : ""} flex size-full items-center justify-center`}
          >
            <BirdIcon className="size-8 text-primary/40" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{sighting.species.swedishName}</h1>
          <p className="text-sm italic text-muted-foreground">
            {sighting.species.scientificName}
          </p>
        </div>
      </div>

      {sighting.rarityLevel && sighting.rarityLabel && (() => {
        const levelColors: Record<string, { bg: string; text: string; dot: string }> = {
          very_common: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
          common: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
          uncommon: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
          rare: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
          not_observed: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400" },
        };
        const colors = levelColors[sighting.rarityLevel!] ?? levelColors.not_observed;
        return (
          <div className={`flex flex-col gap-1.5 rounded-lg p-3 ${colors.bg}`}>
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${colors.dot}`} />
              <span className={`text-sm font-semibold ${colors.text}`}>
                {sighting.rarityLabel}
              </span>
              {sighting.rarityRank && (
                <span className={`ml-auto text-xs ${colors.text} opacity-70`}>
                  #{sighting.rarityRank} av {sighting.rarityTotalSpecies} arter
                </span>
              )}
            </div>
            {sighting.rarityDescription && (
              <p className={`text-xs leading-relaxed ${colors.text} opacity-80`}>
                {sighting.rarityDescription}
              </p>
            )}
          </div>
        );
      })()}

      <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Datum</span>
          <span className="text-sm font-medium">
            {format(sighting.date, "d MMMM yyyy", { locale: sv })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Koordinater</span>
          <span className="text-sm font-medium">
            {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
          </span>
        </div>

        {sighting.location && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plats</span>
            <span className="flex items-center gap-1 text-sm font-medium">
              <MapPinIcon className="size-3" />
              {sighting.location}
            </span>
          </div>
        )}

        {sighting.notes && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Anteckningar</span>
            <p className="text-sm">{sighting.notes}</p>
          </div>
        )}
      </div>

      <SightingMap
        markers={[
          {
            lat: sighting.latitude,
            lng: sighting.longitude,
            label: sighting.location || sighting.species.swedishName,
          },
        ]}
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate(`/edit/${sighting.id}`, { state: { sighting } })}
        >
          <PencilIcon className="size-4" />
          Redigera
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={async () => {
            try {
              await deleteSighting({ variables: { deleteSightingId: sighting.id } });
              toast.success("Observation raderad");
              navigate("/sightings");
            } catch (error) {
              toast.error("Observation kunde inte raderas. Vänligen försök igen.");
              console.error(error);
            }
          }}
          disabled={deleting}
        >
          {deleting ? <Spinner /> : <TrashIcon className="size-4" />}
          Radera
        </Button>
      </div>
    </div>
  );
};

export default SightingDetailPage;
