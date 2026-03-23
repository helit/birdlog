import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CREATE_SIGHTING, UPDATE_SIGHTING } from "@/graphql/mutations";
import { MY_SIGHTINGS, SEARCH_SPECIES, MY_LIFE_LIST } from "@/graphql/queries";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const SightingFormPage = () => {
  const navigate = useNavigate();

  const { id } = useParams();
  const { state } = useLocation();
  const sighting = state?.sighting;
  const prefill = state?.prefill;

  const [speciesId, setSpeciesId] = useState(sighting?.species.id ?? prefill?.speciesId ?? "");
  const [latitude, setLatitude] = useState<number | null>(sighting?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(sighting?.longitude ?? null);
  const [location, setLocation] = useState(sighting?.location ?? "");
  const [notes, setNotes] = useState(sighting?.notes ?? "");
  const [date, setDate] = useState(
    sighting?.date.split("T")[0] ?? new Date().toISOString().split("T")[0],
  );
  const [selectedSpeciesName, setSelectedSpeciesName] = useState(
    sighting?.species.swedishName ?? prefill?.swedishName ?? "",
  );

  const [executeSearch, { data }] = useLazyQuery(SEARCH_SPECIES);

  const [open, setOpen] = useState(false);

  const selectSpecies = (species: { id: string; swedishName: string }) => {
    setSpeciesId(species.id);
    setSelectedSpeciesName(species.swedishName);
    setOpen(false);
  };

  const [createSighting, { loading: saving }] = useMutation(CREATE_SIGHTING, {
    refetchQueries: [{ query: MY_SIGHTINGS }, { query: MY_LIFE_LIST }],
    awaitRefetchQueries: true,
  });

  const [updateSighting, { loading: updating }] = useMutation(UPDATE_SIGHTING, {
    refetchQueries: [{ query: MY_SIGHTINGS }, { query: MY_LIFE_LIST }],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!sighting) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(4)));
        setLongitude(Number(pos.coords.longitude.toFixed(4)));
      });
    }
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{id ? "Redigera observation" : "Ny observation"}</h1>
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Art</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="flex w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-accent">
              {selectedSpeciesName || <span className="text-muted-foreground">Sök art...</span>}
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-4rem)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Sök art..."
                  onValueChange={(value) => {
                    if (value.length >= 2) {
                      executeSearch({ variables: { query: value } });
                    }
                  }}
                />
                <CommandList>
                  <CommandEmpty>Ingen art hittades.</CommandEmpty>
                  <CommandGroup>
                    {data?.searchSpecies.map((species: { id: string; swedishName: string }) => (
                      <CommandItem key={species.id} onSelect={() => selectSpecies(species)}>
                        {species.swedishName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Datum</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Plats</label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.0001"
              placeholder="Latitud"
              value={latitude ?? ""}
              onChange={(e) =>
                setLatitude(e.target.value ? Number(Number(e.target.value).toFixed(4)) : null)
              }
            />
            <Input
              type="number"
              step="0.0001"
              placeholder="Longitud"
              value={longitude ?? ""}
              onChange={(e) =>
                setLongitude(e.target.value ? Number(Number(e.target.value).toFixed(4)) : null)
              }
            />
          </div>
          <Input
            placeholder="Platsnamn (valfritt)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.geolocation.getCurrentPosition((pos) => {
                setLatitude(Number(pos.coords.latitude.toFixed(4)));
                setLongitude(Number(pos.coords.longitude.toFixed(4)));
              });
            }}
          >
            Uppdatera position
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Anteckningar</label>
          <Textarea
            placeholder="T.ex. juvenil, sjungande, 3 individer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button
          className="mt-2 w-full"
          onClick={async () => {
            try {
              if (id) {
                await updateSighting({
                  variables: {
                    updateSightingId: id,
                    speciesId,
                    latitude,
                    longitude,
                    date,
                    location: location || undefined,
                    notes: notes || undefined,
                  },
                });
                toast.success("Observation uppdaterad!");
              } else {
                await createSighting({
                  variables: {
                    speciesId,
                    latitude,
                    longitude,
                    date,
                    location: location || undefined,
                    notes: notes || undefined,
                  },
                });
                toast.success("Observation sparad!");
              }
              navigate("/sightings");
            } catch (error) {
              toast.error(
                id
                  ? "Kunde inte uppdatera. Försök igen."
                  : "Observation kunde inte sparas. Vänligen försök igen.",
              );
              console.error(error);
            }
          }}
          disabled={saving || !speciesId || !latitude || !longitude || !date}
        >
          {saving || updating ? "Sparar..." : id ? "Uppdatera observation" : "Spara observation"}
        </Button>
      </Card>
    </div>
  );
};

export default SightingFormPage;
