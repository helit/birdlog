import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_ALL_SPECIES, SEARCH_SPECIES } from "./graphql/queries.js";
import { useAuth } from "./context/AuthContext.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";

interface Species {
  id: string;
  swedishName: string;
  scientificName: string;
  englishName?: string | null;
  family?: string | null;
  description?: string | null;
}

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
    <div className="app">
      <button onClick={logout}>logga ut</button>
      <header className="app-header">
        <h1>BirdLog</h1>
        <p>Din fältguide till svenska fåglar</p>
      </header>

      <p>{`Hej ${user?.name}!`}</p>

      <input
        className="search-input"
        type="text"
        placeholder="Sök arter..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading && <p className="loading">Laddar arter...</p>}
      {error && <p className="error">Kunde inte ladda arter. Kör servern?</p>}

      {!loading && !error && (
        <>
          <p className="species-count">{speciesList.length} arter</p>
          <ul className="species-list">
            {speciesList.map((s) => (
              <li key={s.id} className="species-card">
                <div className="species-name">{s.swedishName}</div>
                <div className="species-scientific">{s.scientificName}</div>
                {s.family && <div className="species-family">{s.family}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
