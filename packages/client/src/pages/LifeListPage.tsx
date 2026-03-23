import EmptyState from "@/components/EmptyState";
import LifeListCard from "@/components/LifeListCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MY_LIFE_LIST } from "@/graphql/queries";
import { MyLifeList } from "@/utils/types";
import { useQuery } from "@apollo/client";

const LifeListSkeleton = () => (
  <div className="overflow-hidden rounded-xl bg-card shadow-sm">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 border-b border-border/50 px-3 py-2 last:border-b-0"
      >
        <Skeleton className="size-12 flex-shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-2.5 w-6" />
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
    <div className="overflow-hidden rounded-xl bg-card shadow-sm">
      {lifeList.map((entry: MyLifeList) => {
        return <LifeListCard key={entry.species.id} lifeList={entry} />;
      })}
    </div>
  );
};

export default LifeListPage;
