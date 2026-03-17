import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_ALL_SPECIES, SEARCH_SPECIES } from "./graphql/queries.js";
import { useAuth } from "./context/AuthContext.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Card, CardContent } from "@/components/ui/card.js";
import { Species } from "./utils/types.js";
import { Toaster } from "sonner";
import LifeListPage from "./pages/LifeListPage.js";

function App() {
  const { user, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: allData,
    loading: allLoading,
    error: allError,
  } = useQuery<{ species: Species[] }>(GET_ALL_SPECIES, {
    skip: !user || searchQuery.length > 0,
  });

  const {
    data: searchData,
    loading: searchLoading,
    error: searchError,
  } = useQuery<{ searchSpecies: Species[] }>(SEARCH_SPECIES, {
    variables: { query: searchQuery },
    skip: !user || searchQuery.length === 0,
  });

  const loading = searchQuery ? searchLoading : allLoading;
  const error = searchQuery ? searchError : allError;
  const speciesList = searchQuery ? (searchData?.searchSpecies ?? []) : (allData?.species ?? []);

  if (!user && !showRegister) {
    return <LoginPage onSwitchToRegister={() => setShowRegister(true)} />;
  }

  if (!user && showRegister) {
    return <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div>
      <LifeListPage />
      <Toaster position="bottom-center" />
    </div>
  );

  // return (
  //   <div>
  //     <SightingFormPage />
  //     <Toaster position="bottom-center"/>
  //   </div>
  // );

  return (
    <div className="mx-auto min-h-screen max-w-md p-4">
      <header className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold">BirdLog</h1>
          <p className="text-sm text-muted-foreground">Din fältguide till svenska fåglar</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Logga ut
        </Button>
      </header>

      <p className="mb-4 text-sm text-muted-foreground">Hej {user?.name}!</p>

      <Input
        type="text"
        placeholder="Sök arter..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />

      {loading && <p className="py-12 text-center text-muted-foreground">Laddar arter...</p>}
      {error && (
        <p className="py-12 text-center text-destructive">Kunde inte ladda arter. Kör servern?</p>
      )}

      {!loading && !error && (
        <>
          <p className="mb-3 text-xs text-muted-foreground">{speciesList.length} arter</p>
          <div className="flex flex-col gap-2">
            {speciesList.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-3">
                  <div className="font-medium">{s.swedishName}</div>
                  <div className="text-xs italic text-muted-foreground">{s.scientificName}</div>
                  {s.family && <div className="mt-1 text-xs text-muted-foreground">{s.family}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
