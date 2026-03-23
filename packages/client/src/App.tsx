import { useAuth } from "./context/AuthContext.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import LifeListPage from "./pages/LifeListPage.js";
import { Navigate, Route, Routes } from "react-router-dom";
import SightingsListPage from "./pages/SightingsListPage.js";
import SightingFormPage from "./pages/SightingFormPage.js";
import SightingDetailPage from "./pages/SightingDetailPage.js";
import LifeListDetailPage from "./pages/LifeListDetailPage.js";
import { Toaster } from "./components/ui/sonner.js";
import BottomNav from "./components/BottomNav.js";
import Header from "./components/Header.js";
import IdentifyPage from "./pages/IdentifyPage.js";
import PhotoIdentifyPage from "./pages/PhotoIdentifyPage.js";
import GuidedIdentifyPage from "./pages/GuidedIdentifyPage.js";
import PickLocationPage from "./pages/PickLocationPage.js";
import BirdInfoPage from "./pages/BirdInfoPage.js";

function App() {
  const { user } = useAuth();

  return (
    <>
      {!user ? (
        <div className="flex min-h-dvh items-center justify-center p-4">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      ) : (
        <>
          <Header />
          <div className="mx-auto w-full max-w-2xl px-4 pb-20">
            <Routes>
              <Route path="/" element={<IdentifyPage />} />
              <Route path="/identify/guided" element={<GuidedIdentifyPage />} />
              <Route path="/identify/photo" element={<PhotoIdentifyPage />} />
              <Route path="/sightings" element={<SightingsListPage />} />
              <Route path="/sighting/:id" element={<SightingDetailPage />} />
              <Route path="/new" element={<SightingFormPage key="new" />} />
              <Route path="/edit/:id" element={<SightingFormPage key="edit" />} />
              <Route path="/pick-location" element={<PickLocationPage />} />
              <Route path="/bird/:scientificName" element={<BirdInfoPage />} />
              <Route path="/life-list" element={<LifeListPage />} />
              <Route path="/life-list/:speciesId" element={<LifeListDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
          </div>
        </>
      )}
      <Toaster position="top-center" />
    </>
  );
}

export default App;
