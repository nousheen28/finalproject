import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppContext } from '@/lib/context';
import { getNearbyAccessiblePlaces, processOsmData } from '@/lib/api';
import { PlaceMarker } from './PlaceMarker';
import { LocationMarker } from './LocationMarker';
import { RouteLayer } from './RouteLayer';
import type { PlaceDetails } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapViewProps {
  height?: string;
  showNearbyPlaces?: boolean;
  onPlaceSelect?: (place: PlaceDetails) => void;
  showControls?: boolean;
  onMapClick?: (latlng: [number, number]) => void;
}

export const MapView: React.FC<MapViewProps> = ({ 
  height = 'h-[calc(100vh-8rem)]',
  showNearbyPlaces = true,
  onPlaceSelect,
  showControls = true,
  onMapClick
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { 
    currentLocation, 
    destination, 
    isNavigating,
    accessibilityPreferences,
    locationPermissionGranted,
    requestLocationPermission,
    locationError,
    setLocationError,
    selectedRoute,
    setCurrentLocation,
    temporaryMarker,
    setTemporaryMarker
  } = useAppContext();
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const defaultLocation = currentLocation || [13.0827, 80.2707]; // Default to Chennai if no location
    const map = L.map(mapContainerRef.current, {
      center: [defaultLocation[0], defaultLocation[1]],
      zoom: 15,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        })
      ],
      zoomControl: showControls
    });

    // Add scale control
    if (showControls) {
      L.control.scale({ imperial: false }).addTo(map);
    }

    // Add click handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      // Clear previous temporary marker
      if (temporaryMarker) {
        map.removeLayer(temporaryMarker);
      }
      
      // Create new marker
      const newMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        })
      }).addTo(map);
      
      // Add popup
      (newMarker as any).bindPopup('Selected Location').openPopup();
      
      // Store marker reference
      setTemporaryMarker(newMarker);
      
      // Call onMapClick callback if provided
      if (onMapClick) {
        onMapClick([lat, lng]);
      }
    });

    mapRef.current = map;
    setMapReady(true);

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showControls, currentLocation, onMapClick, temporaryMarker, setTemporaryMarker]);

  // Update map center when current location changes
  useEffect(() => {
    if (mapRef.current && currentLocation) {
      mapRef.current.setView([currentLocation[0], currentLocation[1]], mapRef.current.getZoom());
    }
  }, [currentLocation]);

  // Fetch nearby places when location changes
  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      if (!currentLocation || !showNearbyPlaces) return;
      
      setIsLoading(true);
      try {
        const [lat, lng] = currentLocation;
        const placesData = await getNearbyAccessiblePlaces(lat, lng, 1000);
        
        // Process the OSM data to extract accessibility information
        const processedPlaces = placesData
          .map(processOsmData)
          .filter(Boolean) as PlaceDetails[];
        
        // Filter places based on accessibility preferences
        const filteredPlaces = processedPlaces.filter(place => {
          // If user requires specific features, check if the place has them
          if (accessibilityPreferences.requiredFeatures.length > 0) {
            return accessibilityPreferences.requiredFeatures.some(requiredFeature => 
              place.accessibilityFeatures.some(
                feature => feature.type === requiredFeature && feature.available
              )
            );
          }
          return true;
        });
        
        setNearbyPlaces(filteredPlaces);
      } catch (error) {
        console.error("Error fetching nearby places:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbyPlaces();
  }, [currentLocation, showNearbyPlaces, accessibilityPreferences.requiredFeatures]);

  // Handle place selection
  const handlePlaceClick = (place: PlaceDetails) => {
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
    
    // Auto-zoom to the selected place
    if (mapRef.current) {
      mapRef.current.setView([place.coordinates[0], place.coordinates[1]], 18);
    }
  };

  // Handle location permission request
  const handleRequestLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      setLocationError("Location permission denied. Please enable location services to use this feature.");
    }
  };

  // Function to center map on user's location
  const centerOnUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 16);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(`Error getting location: ${error.message}`);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Render loading state or error message if no location
  if (!locationPermissionGranted && !currentLocation) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64 bg-muted/20">
        <p className="mb-4 text-center">Location access is required to show the map</p>
        <Button onClick={handleRequestLocation}>
          Enable Location Access
        </Button>
        {locationError && (
          <p className="mt-4 text-sm text-destructive text-center">{locationError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div ref={mapContainerRef} className={`w-full ${height}`} />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-background/80 p-2 rounded-md shadow-md">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading places...</span>
          </div>
        </div>
      )}
      
      {/* Render current location marker */}
      {mapRef.current && currentLocation && mapReady && (
        <LocationMarker map={mapRef.current} position={currentLocation} />
      )}
      
      {/* Render nearby place markers */}
      {mapRef.current && mapReady && nearbyPlaces.map((place) => (
        <PlaceMarker
          key={place.id}
          map={mapRef.current!}
          place={place}
          onClick={() => handlePlaceClick(place)}
          highContrast={accessibilityPreferences.uiPreferences.highContrast}
        />
      ))}
      
      {/* Render route if navigating */}
      {mapRef.current && mapReady && isNavigating && currentLocation && destination && selectedRoute && (
        <RouteLayer
          map={mapRef.current}
          route={selectedRoute}
          accessibilityPreferences={accessibilityPreferences}
          highContrast={accessibilityPreferences.uiPreferences.highContrast}
        />
      )}
      
      {/* Accessibility controls */}
      {showControls && (
        <div className="absolute bottom-4 right-4 bg-background p-2 rounded-md shadow-md z-10 flex flex-col space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => mapRef.current?.zoomIn()}
            className="w-8 h-8 p-0 flex items-center justify-center"
            aria-label="Zoom in"
          >
            +
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => mapRef.current?.zoomOut()}
            className="w-8 h-8 p-0 flex items-center justify-center"
            aria-label="Zoom out"
          >
            -
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={centerOnUserLocation}
            className="w-8 h-8 p-0 flex items-center justify-center"
            aria-label="Center on my location"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
};