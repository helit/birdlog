import { useQuery } from "@apollo/client";
import { SPECIES_RARITY } from "@/graphql/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { rarityColors } from "@/lib/rarityColors";

interface RarityBadgeProps {
  scientificName: string;
  latitude: number;
  longitude: number;
}

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

  const colors = rarityColors[rarity.level] ?? rarityColors.not_observed;

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
