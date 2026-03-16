import { Sighting } from "@/utils/types";
import { Card, CardAction, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";
import { DELETE_SIGHTING } from "@/graphql/mutations";
import { useMutation } from "@apollo/client";
import { MY_SIGHTINGS } from "@/graphql/queries";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface SightingCardArgs {
  sighting: Sighting;
}

const SightingCard = ({ sighting }: SightingCardArgs) => {
  const [deleteSighting, { loading: deleting }] = useMutation(DELETE_SIGHTING, {
    refetchQueries: [MY_SIGHTINGS],
    onCompleted: () => {
      toast.success("Observation raderad");
    },
    onError: (error) => {
      toast.error("Observation kunde inte raderas. Vänligen försök igen.");
      console.error(error);
    },
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{sighting.species.swedishName}</h2>
        <p className="text-sm text-muted-foreground">{sighting.species.scientificName}</p>
      </CardHeader>
      <CardContent>
        <div>{format(sighting.date, "d MMMM yyyy", { locale: sv })}</div>
        <div>{`Coordinates: ${sighting.latitude}, ${sighting.longitude}`}</div>
        <div>{sighting.location ? `Location: ${sighting.location}` : ""}</div>
        <div>{sighting.notes ? `Notes: ${sighting.notes}` : ""}</div>
      </CardContent>
      <CardAction className="px-4 flex gap-2">
        <Button variant="outline" size="icon" disabled>
          <PencilIcon />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => {
            deleteSighting({ variables: { deleteSightingId: sighting.id } });
          }}
          disabled={deleting}
        >
          {deleting ? <Spinner /> : <TrashIcon />}
        </Button>
      </CardAction>
    </Card>
  );
};

export default SightingCard;
