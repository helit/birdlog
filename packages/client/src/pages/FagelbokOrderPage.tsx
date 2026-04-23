import { GuidebookRow } from "@/components/GuidebookRow";
import { Skeleton } from "@/components/ui/skeleton";
import { GET_ORDER_BY_SLUG } from "@/graphql/queries";
import { useQuery } from "@apollo/client";
import { ChevronLeftIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

interface OrderNode {
  slug: string;
  swedishName: string | null;
  scientificName: string;
}

interface FamilyNode {
  slug: string;
  swedishName: string | null;
  scientificName: string;
}

interface OrderDetail {
  order: OrderNode;
  families: FamilyNode[];
}

const ListSkeleton = () => (
  <div className="overflow-hidden rounded-xl bg-card shadow-sm">
    {Array.from({ length: 5 }).map((_, i) => (
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

export function FagelbokOrderPage() {
  const { orderSlug } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_ORDER_BY_SLUG, {
    variables: { slug: orderSlug },
    fetchPolicy: "cache-first",
  });

  const detail: OrderDetail | null = data?.order ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Tillbaka"
          className="rounded-full p-1 active:bg-muted/50"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <p className="p-4 text-center text-sm text-muted-foreground">
          Kunde inte hämta ordningen. Försök igen senare.
        </p>
      ) : !detail ? (
        <div className="rounded-xl bg-card p-6 text-center shadow-sm">
          <p className="mb-3 text-sm text-muted-foreground">
            Ordningen finns inte.
          </p>
          <Link
            to="/guidebook"
            className="inline-block text-sm font-medium text-primary underline"
          >
            Till Fågelboken
          </Link>
        </div>
      ) : (
        <>
          <header className="px-1">
            {detail.order.swedishName ? (
              <>
                <h1 className="text-xl font-semibold leading-tight">
                  {detail.order.swedishName}
                </h1>
                <p className="text-sm italic text-muted-foreground">
                  {detail.order.scientificName}
                </p>
              </>
            ) : (
              <h1 className="text-xl font-semibold italic leading-tight">
                {detail.order.scientificName}
              </h1>
            )}
          </header>
          {detail.families.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Inga familjer har registrerats i den här ordningen.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl bg-card shadow-sm">
              {detail.families.map((f) => (
                <GuidebookRow
                  key={f.scientificName}
                  swedishName={f.swedishName}
                  scientificName={f.scientificName}
                  onClick={() => navigate(`/guidebook/family/${f.slug}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
