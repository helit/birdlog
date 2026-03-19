import { Spinner } from "@/components/ui/spinner";
import { BIRD_OF_THE_DAY } from "@/graphql/queries";
import { useQuery } from "@apollo/client";
import { CameraIcon, PlusIcon, WandSparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const IdentifyPage = () => {
  const navigate = useNavigate();

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const { data, loading } = useQuery(BIRD_OF_THE_DAY, {
    variables: { latitude, longitude },
    skip: !latitude,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl bg-primary/10">
        <div className="flex h-[calc(100svh-15rem)] items-center justify-center">
          {data?.birdOfTheDay?.imageUrl ? (
            <img
              src={data.birdOfTheDay.imageUrl}
              alt={data.birdOfTheDay.vernacularName}
              className="h-full w-full object-cover"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {loading ? <Spinner className="size-8" /> : "Dagens fågel"}
            </p>
          )}
        </div>
        {data?.birdOfTheDay && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-lg font-bold capitalize text-white">
              {data.birdOfTheDay.vernacularName}
            </p>
            <p className="text-sm italic text-white/80">{data.birdOfTheDay.scientificName}</p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-6">
        <button
          className="flex size-14 items-center justify-center rounded-full bg-card shadow-sm active:scale-95"
          onClick={() => navigate("/identify/guided")}
        >
          <WandSparklesIcon className="size-6 text-primary" />
        </button>
        <button
          className="flex size-14 items-center justify-center rounded-full bg-primary shadow-sm active:scale-95"
          onClick={() => navigate("/new")}
        >
          <PlusIcon className="size-6 text-primary-foreground" />
        </button>
        <button
          className="flex size-14 items-center justify-center rounded-full bg-card shadow-sm active:scale-95"
          onClick={() => navigate("/identify/photo")}
        >
          <CameraIcon className="size-6 text-primary" />
        </button>
      </div>
    </div>
  );
};

export default IdentifyPage;
