import { Button } from "@/components/ui/button";
import { DELETE_SIGHTING } from "@/graphql/mutations";
import { MY_SIGHTINGS } from "@/graphql/queries";
import { Sighting } from "@/utils/types";
import { useMutation } from "@apollo/client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeftIcon, MapPinIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const SightingDetailPage = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const sighting: Sighting | undefined = state?.sighting;

  const [deleteSighting, { loading: deleting }] = useMutation(DELETE_SIGHTING, {
    refetchQueries: [MY_SIGHTINGS],
    onCompleted: () => {
      navigate("/");
      toast.success("Observation raderad");
    },
    onError: (error) => {
      toast.error("Observation kunde inte raderas. Vänligen försök igen.");
      console.error(error);
    },
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
        onClick={() => navigate("/")}
      >
        <ArrowLeftIcon className="size-4" />
        Tillbaka
      </button>

      <div>
        <h1 className="text-2xl font-bold">{sighting.species.swedishName}</h1>
        <p className="text-sm text-muted-foreground italic">{sighting.species.scientificName}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Datum</span>
          <span className="text-sm font-medium">{format(sighting.date, "d MMMM yyyy", { locale: sv })}</span>
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

      {/* TODO: Map component will go here */}
      <div className="flex h-48 items-center justify-center rounded-lg bg-muted shadow-sm text-sm text-muted-foreground">
        Karta kommer här
      </div>

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
          onClick={() => deleteSighting({ variables: { deleteSightingId: sighting.id } })}
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
