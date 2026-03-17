import LifeListCard from "@/components/LifeListCard";
import LoadingScreen from "@/components/LoadingScreen";
import { MY_LIFE_LIST } from "@/graphql/queries";
import { MyLifeList } from "@/utils/types";
import { useQuery } from "@apollo/client";

const LifeListPage = () => {
  const { data, loading } = useQuery(MY_LIFE_LIST);

  if (loading) return <LoadingScreen />;

  console.log({ data });

  return (
    <div className="p-4 flex flex-col gap-4">
      {data?.myLifeList.map((lifeList: MyLifeList) => {
        return <LifeListCard key={lifeList.species.id} lifeList={lifeList} />;
      })}
    </div>
  );
};

export default LifeListPage;
