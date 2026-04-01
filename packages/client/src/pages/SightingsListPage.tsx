import { useState } from "react"
import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import SightingCard from "@/components/SightingCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MY_SIGHTINGS } from "@/graphql/queries";
import { isDateSort, SORT_OPTIONS, sortSightings, SortKey } from "@/lib/sortSightings";
import { Sighting } from "@/utils/types";
import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CheckIcon, SlidersHorizontalIcon } from "lucide-react";

const groupByMonth = (sightings: Sighting[]) => {
  const groups: { label: string; sightings: Sighting[] }[] = [];

  for (const sighting of sightings) {
    const label = format(sighting.date, "MMMM yyyy", { locale: sv });

    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.sightings.push(sighting);
    } else {
      groups.push({ label, sightings: [sighting] });
    }
  }

  return groups;
};

const SightingsListPage = () => {
  const { data, loading, error } = useQuery(MY_SIGHTINGS);
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [sheetOpen, setSheetOpen] = useState(false);

  if (loading) return <LoadingScreen />;
  if (error) return <p className="p-4 text-center text-sm text-muted-foreground">Något gick fel. Försök igen senare.</p>;

  const sightings = data?.mySightings ?? [];

  if (sightings.length === 0) return <EmptyState />;

  const sorted = sortSightings(sightings, sort);
  const activeOption = SORT_OPTIONS.find((o) => o.key === sort)!;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="sm" />
            }
          >
            <SlidersHorizontalIcon />
            {sort !== "date-desc" ? activeOption.label : "Sortera"}
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sortera observationer</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  className="flex items-center justify-between px-1 py-3 text-sm border-b border-border/50 last:border-b-0"
                  onClick={() => {
                    setSort(option.key);
                    setSheetOpen(false);
                  }}
                >
                  {option.label}
                  {sort === option.key && <CheckIcon className="size-4 text-primary" />}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isDateSort(sort) ? (
        groupByMonth(sorted).map((group) => (
          <section key={group.label}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h2>
            <div className="overflow-hidden rounded-xl bg-card shadow-sm">
              {group.sightings.map((sighting) => (
                <SightingCard key={sighting.id} sighting={sighting} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="overflow-hidden rounded-xl bg-card shadow-sm">
          {sorted.map((sighting) => (
            <SightingCard key={sighting.id} sighting={sighting} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SightingsListPage;
