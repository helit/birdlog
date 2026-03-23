import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CREATE_SIGHTING, UPDATE_SIGHTING } from "@/graphql/mutations";
import { MY_SIGHTINGS, SEARCH_SPECIES, MY_LIFE_LIST } from "@/graphql/queries";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

const SightingFormPage = () => {
  const navigate = useNavigate();

  const { id } = useParams();
  const { state } = useLocation();
  const sighting = state?.sighting;
  const prefill = state?.prefill;

  const pickedLocation = state?.pickedLocation;

  const [speciesId, setSpeciesId] = useState(
    sighting?.species.id ?? prefill?.speciesId ?? state?.speciesId ?? "",
  );
  const [latitude, setLatitude] = useState<number | null>(
    pickedLocation?.latitude ?? sighting?.latitude ?? null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    pickedLocation?.longitude ?? sighting?.longitude ?? null,
  );
  const [location, setLocation] = useState(sighting?.location ?? state?.location ?? "");
  const [notes, setNotes] = useState(sighting?.notes ?? state?.notes ?? "");
  const [date, setDate] = useState(
    sighting?.date.split("T")[0] ?? state?.date ?? new Date().toISOString().split("T")[0],
  );
  const [selectedSpeciesName, setSelectedSpeciesName] = useState(
    sighting?.species.swedishName ?? prefill?.swedishName ?? state?.selectedSpeciesName ?? "",
  );

  const [executeSearch, { data }] = useLazyQuery(SEARCH_SPECIES);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectSpecies = (species: { id: string; swedishName: string }) => {
    setSpeciesId(species.id);
    setSelectedSpeciesName(species.swedishName);
    setSearchOpen(false);
    setSearchValue("");
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
    if (!sighting && !pickedLocation) {
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
        <div className="relative flex flex-col gap-1">
          <label className="text-sm font-medium">Art</label>
          {searchOpen ? (
            <>
              <Input
                ref={searchInputRef}
                autoFocus
                placeholder="Sök art..."
                value={searchValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchValue(value);
                  if (value.length >= 2) {
                    executeSearch({ variables: { query: value } });
                  }
                }}
                onBlur={() => {
                  // Small delay so tap on result registers before closing
                  setTimeout(() => setSearchOpen(false), 200);
                }}
              />
              {searchValue.length >= 2 && (
                <ul className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md bg-popover shadow-md">
                  {data?.searchSpecies?.length ? (
                    data.searchSpecies.map((species: { id: string; swedishName: string }) => (
                      <li key={species.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSpecies(species)}
                        >
                          {species.swedishName}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-sm text-muted-foreground">Ingen art hittades.</li>
                  )}
                </ul>
              )}
            </>
          ) : (
            <button
              type="button"
              className="flex w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-accent"
              onClick={() => setSearchOpen(true)}
            >
              {selectedSpeciesName || <span className="text-muted-foreground">Sök art...</span>}
            </button>
          )}
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  setLatitude(Number(pos.coords.latitude.toFixed(4)));
                  setLongitude(Number(pos.coords.longitude.toFixed(4)));
                });
              }}
            >
              Nuvarande position
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const returnTo = id ? `/edit/${id}` : "/new";
                navigate("/pick-location", {
                  state: {
                    latitude,
                    longitude,
                    returnTo,
                    formState: {
                      sighting,
                      prefill,
                      speciesId,
                      selectedSpeciesName,
                      date,
                      location,
                      notes,
                    },
                  },
                });
              }}
            >
              <MapPin className="size-4" />
              Välj på karta
            </Button>
          </div>
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
