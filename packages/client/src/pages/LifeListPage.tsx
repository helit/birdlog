import EmptyState from "@/components/EmptyState";
import LifeListCard from "@/components/LifeListCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MY_LIFE_LIST } from "@/graphql/queries";
import { MyLifeList } from "@/utils/types";
import { useQuery } from "@apollo/client";

const LifeListSkeleton = () => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-sm"
      >
        <Skeleton className="size-12 flex-shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-0.5 h-3 w-20" />
        </div>
      </div>
    ))}
  </div>
);

const LifeListPage = () => {
  const { data, loading } = useQuery(MY_LIFE_LIST);

  if (loading) return <LifeListSkeleton />;

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
