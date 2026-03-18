import EmptyState from "@/components/EmptyState";
import LifeListCard from "@/components/LifeListCard";
import LoadingScreen from "@/components/LoadingScreen";
import { MY_LIFE_LIST } from "@/graphql/queries";
import { MyLifeList } from "@/utils/types";
import { useQuery } from "@apollo/client";

const LifeListPage = () => {
  const { data, loading } = useQuery(MY_LIFE_LIST);

  if (loading) return <LoadingScreen />;

  const lifeList = data?.myLifeList ?? [];

  if (lifeList.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-2">
      {lifeList.map((entry: MyLifeList) => {
        return <LifeListCard key={entry.species.id} lifeList={entry} />;
      })}
    </div>
  );
};

export default LifeListPage;
