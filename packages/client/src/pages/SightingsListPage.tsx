import EmptyState from "@/components/EmptyState";
import LoadingScreen from "@/components/LoadingScreen";
import SightingCard from "@/components/SightingCard";
import { MY_SIGHTINGS } from "@/graphql/queries";
import { Sighting } from "@/utils/types";
import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

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
  const { data, loading } = useQuery(MY_SIGHTINGS);

  if (loading) return <LoadingScreen />;

  const sightings = data?.mySightings ?? [];

  if (sightings.length === 0) return <EmptyState />;

  const groups = groupByMonth(sightings);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
            {group.label}
          </h2>
          <div className="flex flex-col gap-2">
            {group.sightings.map((sighting) => (
              <SightingCard key={sighting.id} sighting={sighting} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SightingsListPage;
