import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { proxyImageUrl } from "@/lib/utils";
import { BirdIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

interface BirdIdentification {
  swedishName: string;
  scientificName: string;
  confidence: "high" | "medium" | "low";
  description: string;
  speciesId: string | null;
  imageUrl: string | null;
}

const PhotoIdentifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const imageData = location.state?.imageData as string | undefined;

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BirdIdentification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!imageData) {
    return <Navigate to="/" replace />;
  }

  const handleIdentify = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://${window.location.hostname}:4000/api/identify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData }),
        },
      );

      if (!response.ok) {
        throw new Error("Identification failed");
      }

      const data = await response.json();
      setResults(data.results);
    } catch {
      setError("Kunde inte identifiera fågeln. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  const confidenceLabel = {
    high: "Hög",
    medium: "Medel",
    low: "Låg",
  };

  const confidenceColor = {
    high: "text-green-700 bg-green-100",
    medium: "text-amber-700 bg-amber-100",
    low: "text-red-700 bg-red-100",
  };

  const topResult = results?.[0] ?? null;
  const otherResults = results?.slice(1) ?? [];

  const navigateToLog = (bird: BirdIdentification) => {
    navigate("/new", {
      state: {
        prefill: {
          speciesId: bird.speciesId ?? undefined,
          swedishName: bird.swedishName,
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Photo with top result overlay */}
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        <img
          src={imageData}
          alt="Fågelbild"
          className="w-full object-cover"
        />

        {/* Top result overlay on photo */}
        {topResult && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-4 pt-12">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColor[topResult.confidence]}`}
                >
                  {confidenceLabel[topResult.confidence]}
                </span>
                <p className="mt-1 text-lg font-semibold text-white">
                  {topResult.swedishName}
                </p>
                <p className="text-sm italic text-white/70">
                  {topResult.scientificName}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {topResult.description}
                </p>
              </div>
              {topResult.imageUrl && (
                <div className="size-16 flex-shrink-0 overflow-hidden rounded-lg border-2 border-white/30">
                  <img
                    src={proxyImageUrl(topResult.imageUrl) ?? undefined}
                    alt={topResult.swedishName}
                    className="size-full object-cover"
                  />
                </div>
              )}
            </div>
            <Button
              className="mt-3 w-full"
              onClick={() => navigateToLog(topResult)}
            >
              <PlusIcon className="mr-2 size-4" />
              Logga observation
            </Button>
          </div>
        )}
      </div>

      {/* Action buttons (before identification) */}
      {!results && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/")}
          >
            Byt foto
          </Button>
          <Button
            className="flex-1"
            onClick={handleIdentify}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 size-4" />
                Analyserar...
              </>
            ) : (
              "Identifiera"
            )}
          </Button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      {/* Other candidates */}
      {otherResults.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Andra möjliga arter
          </h2>
          {otherResults.map((bird, i) => (
            <button
              key={i}
              className="flex w-full items-start gap-3 rounded-xl bg-card p-3 text-left shadow-sm active:scale-[0.98]"
              onClick={() => navigateToLog(bird)}
            >
              <div className="size-14 flex-shrink-0 overflow-hidden rounded-lg bg-primary/10">
                {bird.imageUrl ? (
                  <img
                    src={proxyImageUrl(bird.imageUrl) ?? undefined}
                    alt={bird.swedishName}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <BirdIcon className="size-6 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{bird.swedishName}</p>
                    <p className="text-xs italic text-muted-foreground">
                      {bird.scientificName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColor[bird.confidence]}`}
                  >
                    {confidenceLabel[bird.confidence]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bird.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Bottom actions after identification */}
      {results && results.length > 0 && (
        <Button
          variant="outline"
          onClick={() => navigate("/")}
        >
          Ny identifiering
        </Button>
      )}

      {/* No bird found */}
      {results && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8">
          <BirdIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Kunde inte hitta någon fågel i bilden
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
          >
            Försök igen
          </Button>
        </div>
      )}
    </div>
  );
};

export default PhotoIdentifyPage;
