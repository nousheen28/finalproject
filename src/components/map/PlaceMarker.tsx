import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { PlaceDetails } from '@/lib/api';

interface PlaceMarkerProps {
  map: L.Map;
  place: PlaceDetails;
  onClick?: () => void;
  highContrast?: boolean;
}

export const PlaceMarker: React.FC<PlaceMarkerProps> = ({ 
  map, 
  place, 
  onClick,
  highContrast = false
}) => {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Determine marker color based on accessibility features
    const hasWheelchair = place.accessibilityFeatures.some(
      f => f.type === 'wheelchair' && f.available
    );
    
    const markerColor = hasWheelchair ? 'green' : 'gray';
    const textColor = highContrast ? 'black' : 'white';
    const borderColor = highContrast ? 'black' : 'white';
    const bgColor = highContrast ? 
      (hasWheelchair ? 'bg-green-500' : 'bg-gray-500') : 
      (hasWheelchair ? 'bg-green-500' : 'bg-gray-500');
    
    // Create custom icon for place
    const placeIcon = L.divIcon({
      className: 'place-marker',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full ${bgColor} border-2 border-${borderColor} text-${textColor}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [24, 24] as L.PointExpression,
      iconAnchor: [12, 24] as L.PointExpression
    });

    // Create marker if it doesn't exist
    if (!markerRef.current) {
      markerRef.current = L.marker([place.coordinates[0], place.coordinates[1]], { icon: placeIcon })
        .addTo(map);
      
      // Add tooltip and click handler
      const marker = markerRef.current;
      marker.bindTooltip(place.name, { 
        permanent: highContrast, 
        direction: 'top',
        className: highContrast ? 'high-contrast-tooltip' : ''
      });
      
      marker.on('click', () => {
        if (onClick) onClick();
      });
    } else {
      // Update marker icon if high contrast setting changes
      const marker = markerRef.current;
      marker.setIcon(placeIcon);
      
      // Update tooltip
      marker.unbindTooltip();
      marker.bindTooltip(place.name, { 
        permanent: highContrast, 
        direction: 'top',
        className: highContrast ? 'high-contrast-tooltip' : ''
      });
    }

    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map, place, onClick, highContrast]);

  return null; // This is a non-visual component that manipulates the map
};