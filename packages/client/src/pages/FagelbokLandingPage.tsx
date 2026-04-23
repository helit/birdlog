import { GuidebookRow } from "@/components/GuidebookRow";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GET_ALL_ORDERS, SPECIES_SEARCH } from "@/graphql/queries";
import {
  getPersistedGuidebookQuery,
  setPersistedGuidebookQuery,
} from "@/lib/guidebookSearchState";
import { useQuery } from "@apollo/client";
import { XIcon } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface OrderNode {
  slug: string;
  swedishName: string | null;
  scientificName: string;
}

interface SpeciesSummary {
  id: string;
  swedishName: string;
  scientificName: string;
}

const OrdersSkeleton = () => (
  <div className="overflow-hidden rounded-xl bg-card shadow-sm">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 border-b border-border/50 px-3 py-3 last:border-b-0"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
);

export function FagelbokLandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>(() => getPersistedGuidebookQuery());
  const deferredQuery = useDeferredValue(query);
  const trimmed = deferredQuery.trim();
  const isSearching = trimmed.length > 0;

  const ordersQuery = useQuery(GET_ALL_ORDERS, { fetchPolicy: "cache-first" });
  const searchQuery = useQuery(SPECIES_SEARCH, {
    variables: { query: trimmed },
    skip: !isSearching,
  });

  // Spec: search query is preserved across drill-down + back, cleared on
  // full reload or tab unmount. The singleton survives in-app navigation,
  // so the unmount-side cleanup is what distinguishes "switch tab" from
  // "drill into a species and return".
  useEffect(() => {
    return () => setPersistedGuidebookQuery("");
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setPersistedGuidebookQuery(value);
  }

  function handleClear() {
    handleChange("");
  }

  const orders: OrderNode[] = ordersQuery.data?.allOrders ?? [];
  const results: SpeciesSummary[] = searchQuery.data?.speciesSearch ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-2 pt-1">
        <label htmlFor="fagelbok-search" className="sr-only">
          Sök bland arter
        </label>
        <div className="relative">
          <Input
            id="fagelbok-search"
            type="search"
            placeholder="Sök art…"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            className="h-10 pr-9"
            autoComplete="off"
            autoCorrect="off"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Rensa sökning"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground active:bg-muted/50"
            >
              <XIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <SearchResults
          loading={searchQuery.loading}
          error={!!searchQuery.error}
          results={results}
          onSelect={(scientificName) =>
            navigate(`/bird/${encodeURIComponent(scientificName)}`)
          }
        />
      ) : (
        <OrdersList
          loading={ordersQuery.loading}
          error={!!ordersQuery.error}
          orders={orders}
          onSelect={(slug) => navigate(`/guidebook/order/${slug}`)}
        />
      )}
    </div>
  );
}

interface OrdersListProps {
  loading: boolean;
  error: boolean;
  orders: OrderNode[];
  onSelect: (slug: string) => void;
}

function OrdersList({ loading, error, orders, onSelect }: OrdersListProps) {
  if (loading) return <OrdersSkeleton />;
  if (error)
    return (
      <p className="p-4 text-center text-sm text-muted-foreground">
        Kunde inte hämta ordningar. Försök igen senare.
      </p>
    );
  if (orders.length === 0)
    return (
      <p className="p-4 text-center text-sm text-muted-foreground">
        Inga ordningar har registrerats än.
      </p>
    );
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm">
      {orders.map((o) => (
        <GuidebookRow
          key={o.scientificName}
          swedishName={o.swedishName}
          scientificName={o.scientificName}
          onClick={() => onSelect(o.slug)}
        />
      ))}
    </div>
  );
}

interface SearchResultsProps {
  loading: boolean;
  error: boolean;
  results: SpeciesSummary[];
  onSelect: (scientificName: string) => void;
}

function SearchResults({ loading, error, results, onSelect }: SearchResultsProps) {
  if (error)
    return (
      <p className="p-4 text-center text-sm text-muted-foreground">
        Kunde inte hämta sökresultat. Försök igen senare.
      </p>
    );
  return (
    <div role="status" aria-live="polite" aria-atomic="false">
      <span className="sr-only">
        {loading ? "Söker…" : `${results.length} arter matchar`}
      </span>
      {loading ? (
        <OrdersSkeleton />
      ) : results.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted-foreground">
          Inga arter matchar din sökning.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card shadow-sm">
          {results.map((s) => (
            <GuidebookRow
              key={s.id}
              swedishName={s.swedishName}
              scientificName={s.scientificName}
              onClick={() => onSelect(s.scientificName)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
