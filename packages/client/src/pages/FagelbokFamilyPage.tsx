import { GuidebookRow } from "@/components/GuidebookRow";
import { Skeleton } from "@/components/ui/skeleton";
import { GET_FAMILY_BY_SLUG } from "@/graphql/queries";
import { useQuery } from "@apollo/client";
import { ChevronLeftIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

interface FamilyNode {
  slug: string;
  swedishName: string | null;
  scientificName: string;
  order: { slug: string; swedishName: string | null; scientificName: string };
}

interface SpeciesSummary {
  id: string;
  swedishName: string;
  scientificName: string;
}

interface FamilyDetail {
  family: FamilyNode;
  species: SpeciesSummary[];
}

const ListSkeleton = () => (
  <div className="overflow-hidden rounded-xl bg-card shadow-sm">
    {Array.from({ length: 6 }).map((_, i) => (
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

export function FagelbokFamilyPage() {
  const { familySlug } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_FAMILY_BY_SLUG, {
    variables: { slug: familySlug },
    fetchPolicy: "cache-first",
  });

  const detail: FamilyDetail | null = data?.family ?? null;

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
          Kunde inte hämta familjen. Försök igen senare.
        </p>
      ) : !detail ? (
        <div className="rounded-xl bg-card p-6 text-center shadow-sm">
          <p className="mb-3 text-sm text-muted-foreground">
            Familjen finns inte.
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
            {detail.family.swedishName ? (
              <>
                <h1 className="text-xl font-semibold leading-tight">
                  {detail.family.swedishName}
                </h1>
                <p className="text-sm italic text-muted-foreground">
                  {detail.family.scientificName}
                </p>
              </>
            ) : (
              <h1 className="text-xl font-semibold italic leading-tight">
                {detail.family.scientificName}
              </h1>
            )}
          </header>
          {detail.species.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Inga arter har registrerats i den här familjen.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl bg-card shadow-sm">
              {detail.species.map((s) => (
                <GuidebookRow
                  key={s.id}
                  swedishName={s.swedishName}
                  scientificName={s.scientificName}
                  onClick={() =>
                    navigate(`/bird/${encodeURIComponent(s.scientificName)}`)
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
