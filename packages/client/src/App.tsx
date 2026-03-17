import { useAuth } from "./context/AuthContext.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import LifeListPage from "./pages/LifeListPage.js";
import { Navigate, Route, Routes } from "react-router-dom";
import SightingsListPage from "./pages/SightingsListPage.js";
import SightingFormPage from "./pages/SightingFormPage.js";
import { Toaster } from "./components/ui/sonner.js";
import BottomNav from "./components/BottomNav.js";
import Header from "./components/Header.js";

function App() {
  const { user } = useAuth();

  return (
    <>
      {!user ? (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      ) : (
        <>
          <div className="mx-auto min-h-screen max-w-md p-4 mb-14">
            <Header />
            <Routes>
              <Route path="/" element={<SightingsListPage />} />
              <Route path="/new" element={<SightingFormPage />} />
              <Route path="/edit/:id" element={<SightingFormPage />} />
              <Route path="/life-list" element={<LifeListPage />} />
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
