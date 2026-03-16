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
import { CREATE_SIGHTING } from "@/graphql/mutations";
import { SEARCH_SPECIES } from "@/graphql/queries";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const SightingFormPage = () => {
  const [speciesId, setSpeciesId] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [executeSearch, { data }] = useLazyQuery(SEARCH_SPECIES);

  const [open, setOpen] = useState(false);

  const [selectedSpeciesName, setSelectedSpeciesName] = useState("");

  const selectSpecies = (species: { id: string; swedishName: string }) => {
    setSpeciesId(species.id);
    setSelectedSpeciesName(species.swedishName);
    setOpen(false);
  };

  const [createSighting, { loading: saving }] = useMutation(CREATE_SIGHTING, {
    onCompleted: () => {
      resetForm();
      toast.success("Observation sparad!");
    },
    onError: (error) => {
      toast.error("Observation kunde inte sparas. Vänligen försök igen.");
      console.error(error);
    },
  });

  const resetForm = () => {
    setLocation("");
    setNotes("");
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
    });
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-md p-4">
      <h1 className="mb-6 text-xl font-bold">Ny observation</h1>
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Art</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
              <Button variant="outline" className="w-full justify-start">
                {selectedSpeciesName || "Sök art..."}
              </Button>
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
          {latitude ? (
            <p className="text-xs text-muted-foreground">
              {latitude.toFixed(4)}, {longitude?.toFixed(4)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Hämtar position...</p>
          )}
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
                setLatitude(pos.coords.latitude);
                setLongitude(pos.coords.longitude);
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
          onClick={() => {
            createSighting({
              variables: {
                speciesId,
                latitude,
                longitude,
                date,
                location: location || undefined,
                notes: notes || undefined,
              },
            });
          }}
          disabled={saving || !speciesId || !latitude || !longitude || !date}
        >
          {saving ? "Sparar..." : "Spara observation"}
        </Button>
      </Card>
    </div>
  );
};

export default SightingFormPage;
