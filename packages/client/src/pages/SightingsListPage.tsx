import LoadingScreen from "@/components/LoadingScreen";
import SightingCard from "@/components/SightingCard";
import { MY_SIGHTINGS } from "@/graphql/queries";
import { Sighting } from "@/utils/types";
import { useQuery } from "@apollo/client";

const SightingsListPage = () => {
  const { data, loading } = useQuery(MY_SIGHTINGS);

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col gap-4">
      {data?.mySightings.map((sighting: Sighting) => {
        return <SightingCard key={sighting.id} sighting={sighting} />;
      })}
    </div>
  );
};

export default SightingsListPage;
