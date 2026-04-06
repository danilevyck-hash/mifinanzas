"use client";

import { useState } from "react";

type Props = {
  onLocation: (lat: number, lng: number) => void;
  existingLat?: number;
  existingLng?: number;
};

export default function LocationTag({ onLocation, existingLat, existingLng }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!existingLat);

  const lat = existingLat;
  const lng = existingLng;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta ubicacion");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocation(position.coords.latitude, position.coords.longitude);
        setSaved(true);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Permiso de ubicacion denegado");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Ubicacion no disponible");
            break;
          default:
            setError("Error obteniendo ubicacion");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex items-center gap-2 min-h-[36px]">
      {saved && lat && lng ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs text-green-600 dark:text-green-400">Ubicacion guardada</span>
          <span className="text-xs text-muted dark:text-gray-500">({lat.toFixed(4)}, {lng.toFixed(4)})</span>
        </>
      ) : (
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted dark:text-gray-400 hover:text-accent dark:hover:text-accent transition-colors min-h-[36px]"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Obteniendo...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Agregar ubicacion</span>
            </>
          )}
        </button>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
