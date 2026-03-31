import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getIdentifyErrorMessage, proxyImageUrl } from "@/lib/utils";
import {
  ArrowLeftIcon,
  BirdIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface BirdIdentification {
  swedishName: string;
  scientificName: string;
  confidence: "high" | "medium" | "low";
  description: string;
  speciesId: string | null;
  imageUrl: string | null;
}

const SIZES = [
  { value: "Mycket liten (gärdsmyg)", label: "Mycket liten", example: "Gärdsmyg" },
  { value: "Liten (sparv)", label: "Liten", example: "Sparv" },
  { value: "Medel (koltrast)", label: "Medel", example: "Koltrast" },
  { value: "Stor (kråka)", label: "Stor", example: "Kråka" },
  { value: "Mycket stor (svan)", label: "Mycket stor", example: "Svan" },
];

const COLORS = [
  { value: "Svart", bg: "bg-gray-900", text: "text-white" },
  { value: "Vit", bg: "bg-white border border-gray-300", text: "text-gray-900" },
  { value: "Grå", bg: "bg-gray-400", text: "text-white" },
  { value: "Brun", bg: "bg-amber-800", text: "text-white" },
  { value: "Gul", bg: "bg-yellow-400", text: "text-gray-900" },
  { value: "Orange", bg: "bg-orange-500", text: "text-white" },
  { value: "Röd", bg: "bg-red-600", text: "text-white" },
  { value: "Grön", bg: "bg-green-600", text: "text-white" },
  { value: "Blå", bg: "bg-blue-600", text: "text-white" },
];

const HABITATS = [
  { value: "Skog", emoji: "🌲" },
  { value: "Trädgård/park", emoji: "🌳" },
  { value: "Sjö/vattendrag", emoji: "💧" },
  { value: "Hav/kust", emoji: "🌊" },
  { value: "Åker/äng", emoji: "🌾" },
  { value: "Fjäll/hed", emoji: "⛰️" },
];

const TOTAL_STEPS = 4;

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

const GuidedIdentifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { latitude, longitude } = (location.state as { latitude?: number; longitude?: number }) ?? {};

  const [step, setStep] = useState(0);
  const [size, setSize] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [habitat, setHabitat] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BirdIdentification[] | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleColor = (color: string) => {
    setColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color],
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/identify/guided",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ size, colors, habitat, notes: notes || undefined, latitude, longitude }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "unknown");
      }

      const data = await response.json();
      setResults(data.results);
      setTip(data.tip ?? null);
    } catch (e) {
      setError(getIdentifyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else navigate("/");
  };

  const handleReset = () => {
    setStep(0);
    setSize("");
    setColors([]);
    setHabitat("");
    setNotes("");
    setResults(null);
    setTip(null);
    setError(null);
  };

  const handleRefine = () => {
    setStep(3);
    setResults(null);
    setError(null);
  };

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

  // Results view
  if (results) {
    return (
      <div className="flex flex-col gap-4">
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground"
          onClick={handleReset}
        >
          <ArrowLeftIcon className="size-4" />
          Ny sökning
        </button>

        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <BirdIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Kunde inte hitta någon fågel som matchar beskrivningen
            </p>
            <Button variant="outline" onClick={handleReset}>
              Försök igen
            </Button>
          </div>
        ) : (
          <>
            {tip && (
              <button
                className="flex w-full items-center gap-3 rounded-xl bg-amber-50 p-3 text-left shadow-sm active:scale-[0.98]"
                onClick={handleRefine}
              >
                <span className="text-lg">💡</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-amber-900">{tip}</p>
                  <p className="mt-0.5 text-xs text-amber-700">Tryck för att förfina sökningen</p>
                </div>
              </button>
            )}

            {results.map((bird, i) => (
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
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                    <PlusIcon className="size-3" />
                    Logga observation
                  </div>
                </div>
              </button>
            ))}

            <Button variant="outline" onClick={handleReset}>
              Ny sökning
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <button
          aria-label="Tillbaka"
          className="flex items-center gap-1 text-sm text-muted-foreground"
          onClick={handleBack}
        >
          <ArrowLeftIcon className="size-4" />
        </button>
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {step + 1}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Step 0: Size */}
      {step === 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Hur stor var fågeln?</h2>
          <p className="text-sm text-muted-foreground">
            Jämför med en fågel du känner till
          </p>
          <div className="flex flex-col gap-2">
            {SIZES.map((s) => (
              <button
                key={s.value}
                className={`rounded-xl px-4 py-3 text-left shadow-sm active:scale-[0.98] ${
                  size === s.value
                    ? "bg-primary text-white"
                    : "bg-card"
                }`}
                onClick={() => {
                  setSize(s.value);
                  setStep(1);
                }}
              >
                <span className="font-medium">{s.label}</span>
                <span className="ml-2 text-sm opacity-70">
                  som en {s.example.toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Colors */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Vilka färger hade fågeln?</h2>
          <p className="text-sm text-muted-foreground">
            Välj en eller flera färger
          </p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${c.bg} ${c.text} ${
                  colors.includes(c.value)
                    ? "ring-2 ring-primary ring-offset-2"
                    : "opacity-70"
                }`}
                onClick={() => toggleColor(c.value)}
              >
                {c.value}
              </button>
            ))}
          </div>
          <Button
            className="mt-2"
            disabled={colors.length === 0}
            onClick={() => setStep(2)}
          >
            Nästa
          </Button>
        </div>
      )}

      {/* Step 2: Habitat */}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Var såg du fågeln?</h2>
          <p className="text-sm text-muted-foreground">
            Välj den miljö som passar bäst
          </p>
          <div className="grid grid-cols-2 gap-2">
            {HABITATS.map((h) => (
              <button
                key={h.value}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-left shadow-sm active:scale-[0.98] ${
                  habitat === h.value
                    ? "bg-primary text-white"
                    : "bg-card"
                }`}
                onClick={() => {
                  setHabitat(h.value);
                  setStep(3);
                }}
              >
                <span className="text-xl">{h.emoji}</span>
                <span className="font-medium">{h.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Notes + Submit */}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Något mer?</h2>
          <p className="text-sm text-muted-foreground">
            Beskriv beteende, sång, speciella fältmärken eller annat som kan hjälpa
          </p>
          <textarea
            className="min-h-[100px] rounded-xl border-0 bg-card p-3 shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder='T.ex. "röd fläck på huvudet", "hackade på trädstammen"'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Summary */}
          <div className="rounded-xl bg-card p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sammanfattning
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {SIZES.find((s) => s.value === size)?.label}
              </span>
              {colors.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-primary"
                >
                  {c}
                </span>
              ))}
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {habitat}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Spinner className="mr-2 size-4" />
                Analyserar...
              </>
            ) : (
              <>
                <SearchIcon className="mr-2 size-4" />
                Identifiera
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GuidedIdentifyPage;
