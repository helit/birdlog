import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BirdIcon } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

interface BirdIdentification {
  swedishName: string;
  scientificName: string;
  confidence: "high" | "medium" | "low";
  description: string;
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

  return (
    <div className="flex flex-col gap-4">
      {/* Image preview */}
      <div className="overflow-hidden rounded-xl shadow-sm">
        <img
          src={imageData}
          alt="Fågelbild"
          className="w-full object-cover"
        />
      </div>

      {/* Action buttons */}
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

      {/* Results */}
      {results && results.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resultat
          </h2>
          {results.map((bird, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BirdIcon className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">{bird.swedishName}</p>
                    <p className="text-xs italic text-muted-foreground">
                      {bird.scientificName}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColor[bird.confidence]}`}
                >
                  {confidenceLabel[bird.confidence]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {bird.description}
              </p>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() => navigate("/")}
          >
            Ny identifiering
          </Button>
        </div>
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
