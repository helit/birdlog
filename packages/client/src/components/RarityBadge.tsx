import { useQuery } from "@apollo/client";
import { SPECIES_RARITY } from "@/graphql/queries";
import { Skeleton } from "@/components/ui/skeleton";

interface RarityBadgeProps {
  scientificName: string;
  latitude: number;
  longitude: number;
}

const levelColors: Record<string, { bg: string; text: string; dot: string }> = {
  very_common: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  common: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  uncommon: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  rare: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  not_observed: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
};

const RarityBadge = ({ scientificName, latitude, longitude }: RarityBadgeProps) => {
  const { data, loading, error } = useQuery(SPECIES_RARITY, {
    variables: { scientificName, latitude, longitude },
  });

  if (loading) {
    return <Skeleton className="h-20 w-full rounded-lg" />;
  }

  if (error) {
    console.error("RarityBadge error:", error.message);
    return null;
  }

  const rarity = data?.speciesRarity;
  if (!rarity) return null;

  const colors = levelColors[rarity.level] ?? levelColors.not_observed;

  return (
    <div className={`flex flex-col gap-1.5 rounded-lg p-3 ${colors.bg}`}>
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${colors.dot}`} />
        <span className={`text-sm font-semibold ${colors.text}`}>
          {rarity.label}
        </span>
        {rarity.rank && (
          <span className={`ml-auto text-xs ${colors.text} opacity-70`}>
            #{rarity.rank} av {rarity.totalSpeciesInArea} arter
          </span>
        )}
      </div>
      <p className={`text-xs leading-relaxed ${colors.text} opacity-80`}>
        {rarity.description}
      </p>
    </div>
  );
};

export default RarityBadge;
