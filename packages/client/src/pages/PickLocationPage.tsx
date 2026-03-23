import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const DEFAULT_CENTER: [number, number] = [59.33, 18.07]; // Stockholm

function MapCenterTracker({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleMove = () => {
      const center = map.getCenter();
      onMove(
        Number(center.lat.toFixed(4)),
        Number(center.lng.toFixed(4)),
      );
    };
    map.on("moveend", handleMove);
    return () => { map.off("moveend", handleMove); };
  }, [map, onMove]);

  return null;
}

const PickLocationPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const returnTo = state?.returnTo ?? "/new";

  const initialCenter: [number, number] = state?.latitude && state?.longitude
    ? [state.latitude, state.longitude]
    : DEFAULT_CENTER;

  const [lat, setLat] = useState(Number(initialCenter[0].toFixed(4)));
  const [lng, setLng] = useState(Number(initialCenter[1].toFixed(4)));

  const handleConfirm = () => {
    navigate(returnTo, {
      state: {
        ...state?.formState,
        pickedLocation: { latitude: lat, longitude: lng },
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="relative flex-1">
        <MapContainer
          center={initialCenter}
          zoom={14}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapCenterTracker onMove={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
        </MapContainer>

        {/* Fixed center marker */}
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
          <div className="flex flex-col items-center -mt-8">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="oklch(0.45 0.15 145)" />
              <circle cx="16" cy="16" r="6" fill="white" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="safe-area-bottom bg-background px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <p className="mb-2 text-center text-sm text-muted-foreground">
          {lat}, {lng}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
            Avbryt
          </Button>
          <Button className="flex-1" onClick={handleConfirm}>
            Bekräfta position
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PickLocationPage;
