import SightingCard from "@/components/SightingCard";
import { Spinner } from "@/components/ui/spinner";
import { MY_SIGHTINGS } from "@/graphql/queries";
import { Sighting } from "@/utils/types";
import { useQuery } from "@apollo/client";

const SightingsListPage = () => {
  const { data, loading } = useQuery(MY_SIGHTINGS);

  if (loading) return <Spinner />;

  return (
    <div className="p-4 flex flex-col gap-4">
      {data?.mySightings.map((sighting: Sighting) => {
        return <SightingCard key={sighting.id} sighting={sighting} />;
      })}
    </div>
  );
};

export default SightingsListPage;
