import { MyLifeList } from "@/utils/types";
import { Card, CardAction, CardContent, CardHeader } from "./ui/card";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface LifeListCardArgs {
  lifeList: MyLifeList;
}

const LifeListCard = ({ lifeList }: LifeListCardArgs) => {
  const getMonths = (months: number[]) => {
    return months
      .sort((a, b) => a - b)
      .map((m) => format(new Date(2000, m - 1), "MMM", { locale: sv }))
      .join(", ");
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{lifeList.species.swedishName}</h2>
        <p className="text-sm text-muted-foreground">{lifeList.species.scientificName}</p>
      </CardHeader>
      <CardContent>
        <div>{`Senast observerad ${format(lifeList.lastSeenAt, "d MMMM yyyy", { locale: sv })}`}</div>
        <div>{`Antal observationer: ${lifeList.sightingCount}`}</div>
        <div>{`Månader: ${getMonths(lifeList.months)}`}</div>
      </CardContent>
      <CardAction className="px-4 flex gap-2"></CardAction>
    </Card>
  );
};

export default LifeListCard;
