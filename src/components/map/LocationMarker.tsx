import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LocationMarkerProps {
  map: L.Map;
  position: [number, number];
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({ map, position }) => {
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    // Create custom icon for current location
    const locationIcon = L.divIcon({
      className: 'current-location-marker',
      html: `
        <div class="relative">
          <div class="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
          <div class="absolute w-12 h-12 bg-blue-500 opacity-20 rounded-full -left-4 -top-4"></div>
        </div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    // Create marker if it doesn't exist
    if (!markerRef.current) {
      markerRef.current = L.marker([position[0], position[1]], { icon: locationIcon })
        .addTo(map);
    } else {
      // Update marker position
      markerRef.current.setLatLng([position[0], position[1]]);
    }

    // Create or update accuracy circle
    if (!circleRef.current) {
      circleRef.current = L.circle([position[0], position[1]], {
        radius: 50, // Accuracy radius in meters
        color: '#4299e1',
        fillColor: '#4299e1',
        fillOpacity: 0.15,
        weight: 1
      }).addTo(map);
    } else {
      circleRef.current.setLatLng([position[0], position[1]]);
    }

    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
    };
  }, [map, position]);

  return null; // This is a non-visual component that manipulates the map
};