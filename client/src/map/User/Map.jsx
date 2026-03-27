import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import {
  MdMyLocation,
  MdFullscreen,
  MdFullscreenExit,
  MdMap,
  MdSatellite,
} from "react-icons/md";

// Fix for default marker icon issues with Webpack/Vite
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const SearchControl = ({ onLocationSelect }) => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider: provider,
      style: "bar",
      showMarker: false, // We manage our own marker
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Search for address...",
    });

    map.addControl(searchControl);

    const handleShowLocation = (e) => {
      const { x, y } = e.location; // x=lng, y=lat
      onLocationSelect(y, x);
    };

    map.on("geosearch/showlocation", handleShowLocation);

    return () => {
      map.removeControl(searchControl);
      map.off("geosearch/showlocation", handleShowLocation);
    };
  }, [map, onLocationSelect]);

  return null;
};

const LocationMarker = ({
  onLocationSelect,
  selectedLocation,
  isFullScreen,
  toggleFullScreen,
  mapType,
  toggleMapType,
}) => {
  const [position, setPosition] = useState(null);
  const map = useMap();
  const controlsRef = useRef(null);

  // Disable click propagation on controls to prevent map click events
  useEffect(() => {
    if (controlsRef.current) {
      L.DomEvent.disableClickPropagation(controlsRef.current);
      L.DomEvent.disableScrollPropagation(controlsRef.current);
    }
  }, []);

  // Handle map clicks to set location manually
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  // Effect to update marker if parent passes a new location (e.g. initial load)
  useEffect(() => {
    if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      const coords = [selectedLocation.lat, selectedLocation.lng];
      setPosition(coords);
      map.flyTo(coords, 14);
    }
  }, [selectedLocation, map]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = [latitude, longitude];
        setPosition(coords);
        onLocationSelect(latitude, longitude);
        map.flyTo(coords, 14);
      },
      () => {
        alert("Unable to retrieve your location");
      },
    );
  };

  return (
    <>
      {position && (
        <Marker position={position}>
          <Popup>Selected Location</Popup>
        </Marker>
      )}

      {/* MAP CONTROLS OVERLAY */}
      <div
        ref={controlsRef}
        className="absolute top-4 right-4 z-[1000] flex flex-col gap-2"
      >
        {/* LOCATE ME BUTTON */}
        <button
          onClick={(e) => {
            handleLocateMe();
          }}
          type="button"
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 w-10 h-10 transition-colors cursor-pointer"
          title="Locate Me"
        >
          <MdMyLocation size={20} />
        </button>

        {/* MAP TYPE TOGGLE (SATELLITE/NORMAL) */}
        <button
          onClick={(e) => {
            toggleMapType();
          }}
          type="button"
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 w-10 h-10 transition-colors cursor-pointer"
          title={
            mapType === "normal" ? "Switch to Satellite" : "Switch to Normal"
          }
        >
          {mapType === "normal" ? (
            <MdSatellite size={20} />
          ) : (
            <MdMap size={20} />
          )}
        </button>

        {/* FULLSCREEN TOGGLE BUTTON */}
        <button
          onClick={toggleFullScreen}
          type="button"
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 w-10 h-10 transition-colors cursor-pointer"
          title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullScreen ? (
            <MdFullscreenExit size={20} />
          ) : (
            <MdFullscreen size={20} />
          )}
        </button>
      </div>
    </>
  );
};

const Map = ({ onLocationSelect, selectedLocation, readOnly = false }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mapType, setMapType] = useState("satellite"); // 'normal' | 'satellite'

  const toggleFullScreen = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsFullScreen((prev) => !prev);
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === "normal" ? "satellite" : "normal"));
  };

  return (
    <div
      className={`relative transition-all duration-300 ${
        isFullScreen
          ? "fixed inset-0 z-[9999] w-screen h-screen bg-white"
          : "w-full h-full rounded-2xl overflow-hidden"
      }`}
    >
      <style>{`
        .leaflet-control-geosearch form {
          background: transparent;
          padding: 0;
          border: none;
          box-shadow: none;
          margin-top: 10px;
          margin-left: 10px;
        }
        .leaflet-control-geosearch input.glass {
          background-color: white !important; 
          border-radius: 9999px !important;
          border: none !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          padding: 10px 15px;
          height: 40px;
          outline: none;
          color: #111827; /* Dark text */
        }
        /* Ensure controls sit above fullscreen map if needed */
        .leaflet-top.leaflet-left {
          z-index: 1001; 
        }
        .leaflet-touch .leaflet-control-geosearch .results > * {
           cursor: pointer;
           background-color: white;
           padding: 5px 10px;
           border-bottom: 1px solid #f3f4f6;
        }
      `}</style>
      <MapContainer
        center={[28.6139, 77.209]} // fallback location
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
      >
        <TileLayer
          attribution={
            mapType === "normal"
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              : "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          }
          url={
            mapType === "normal"
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          }
        />
        {!readOnly && <SearchControl onLocationSelect={onLocationSelect} />}
        <LocationMarker
          onLocationSelect={onLocationSelect}
          selectedLocation={selectedLocation}
          isFullScreen={isFullScreen}
          toggleFullScreen={toggleFullScreen}
          mapType={mapType}
          toggleMapType={toggleMapType}
        />
      </MapContainer>
    </div>
  );
};

export default Map;
