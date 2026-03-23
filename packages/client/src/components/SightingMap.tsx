import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type MapMarker = {
  lat: number;
  lng: number;
  label?: string;
};

type SightingMapProps = {
  markers: MapMarker[];
};

const markerSvg = encodeURIComponent(
  '<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="oklch(0.45 0.15 145)"/>' +
  '<circle cx="16" cy="16" r="6" fill="white"/>' +
  '</svg>'
);

const greenIcon = L.icon({
  iconUrl: `data:image/svg+xml,${markerSvg}`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

const SightingMap = ({ markers }: SightingMapProps) => {
  return (
    <MapContainer
      center={[markers[0].lat, markers[0].lng]}
      zoom={12}
      className="h-48 rounded-lg overflow-hidden shadow-sm"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers.map((marker) => (
        <Marker
          key={`${marker.lat}-${marker.lng}`}
          position={[marker.lat, marker.lng]}
          icon={greenIcon}
        >
          <Popup>{marker.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default SightingMap;
