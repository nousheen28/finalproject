import React, { createContext, useContext, useState, useEffect } from 'react';
import { fine } from './fine';
import { AccessibilityPreferences, defaultAccessibilityPreferences, TransportMode, MobilityAidType } from './accessibility-types';
import type { Schema } from './db-types';
import type { Route } from './api';
import { isOnPath, getNextInstruction, speakInstruction, vibrateDevice, vibrationPatterns, findAccessibleRoute } from './api';
import L from 'leaflet';

interface AppState {
  currentLocation: [number, number] | null;
  destination: [number, number] | null;
  isNavigating: boolean;
  accessibilityPreferences: AccessibilityPreferences;
  darkMode: boolean;
  savedPlaces: Schema['places'][];
  selectedRoute: Route | null;
  availableRoutes: Route[];
  transportMode: TransportMode;
  locationPermissionGranted: boolean;
  locationError: string | null;
  isRerouting: boolean;
  currentHeading: number | null;
  temporaryMarker: L.Marker | null;
  updateCurrentLocation: (location: [number, number]) => void;
  setCurrentLocation: (location: [number, number] | null) => void;
  setDestination: (location: [number, number] | null) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  updateAccessibilityPreferences: (prefs: Partial<AccessibilityPreferences>) => void;
  toggleDarkMode: () => void;
  addSavedPlace: (place: Schema['places']) => Promise<void>;
  removeSavedPlace: (placeId: number) => Promise<void>;
  setSelectedRoute: (route: Route | null) => void;
  setAvailableRoutes: (routes: Route[]) => void;
  setTransportMode: (mode: TransportMode) => void;
  requestLocationPermission: () => Promise<boolean>;
  setLocationError: (error: string | null) => void;
  startRerouting: () => void;
  stopRerouting: () => void;
  setCurrentHeading: (heading: number | null) => void;
  setTemporaryMarker: (marker: L.Marker | null) => void;
  findRoutes: (start: [number, number], end: [number, number]) => Promise<Route[]>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [accessibilityPreferences, setAccessibilityPreferences] = useState<AccessibilityPreferences>(
    defaultAccessibilityPreferences
  );
  const [darkMode, setDarkMode] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<Schema['places'][]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [transportMode, setTransportMode] = useState<TransportMode>('walking');
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRerouting, setIsRerouting] = useState(false);
  const [currentHeading, setCurrentHeading] = useState<number | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [temporaryMarker, setTemporaryMarker] = useState<L.Marker | null>(null);
  const { data: session } = fine.auth.useSession();

  // Request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (navigator.geolocation) {
        const permission = await new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { enableHighAccuracy: true }
          );
        });
        
        setLocationPermissionGranted(permission);
        return permission;
      }
      
      setLocationPermissionGranted(false);
      setLocationError("Geolocation is not supported by this browser.");
      return false;
    } catch (error) {
      setLocationPermissionGranted(false);
      setLocationError("Error requesting location permission.");
      return false;
    }
  };

  // Start watching position when navigation begins
  useEffect(() => {
    if (isNavigating && !watchId) {
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation: [number, number] = [
              position.coords.latitude,
              position.coords.longitude
            ];
            setCurrentLocation(newLocation);
            
            // Check if we're on the correct path
            if (selectedRoute && !isRerouting) {
              const onPath = isOnPath(newLocation, selectedRoute.waypoints);
              
              if (!onPath) {
                startRerouting();
                
                // Provide feedback
                speakInstruction("You appear to be off route. Recalculating.");
                vibrateDevice(vibrationPatterns.warning);
              } else {
                // Get next instruction based on current location
                const nextInstruction = getNextInstruction(newLocation, selectedRoute);
                
                // If we're close to a waypoint that has a maneuver, announce it
                if (nextInstruction.distance < 30 && nextInstruction.maneuver) {
                  // Provide haptic feedback based on maneuver type
                  switch (nextInstruction.maneuver) {
                    case 'turn-left':
                      vibrateDevice(vibrationPatterns.turnLeft);
                      break;
                    case 'turn-right':
                      vibrateDevice(vibrationPatterns.turnRight);
                      break;
                    case 'arrive':
                      vibrateDevice(vibrationPatterns.arrival);
                      speakInstruction("You have arrived at your destination.");
                      break;
                  }
                }
              }
            }
          },
          (error) => {
            console.error("Error watching position:", error);
            setLocationError(`Error getting location: ${error.message}`);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
        
        setWatchId(id);
      }
    } else if (!isNavigating && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isNavigating, watchId, selectedRoute, isRerouting]);

  // Get user's current location
  useEffect(() => {
    const getInitialLocation = async () => {
      const permissionGranted = await requestLocationPermission();
      
      if (permissionGranted) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation([position.coords.latitude, position.coords.longitude]);
          },
          (error) => {
            console.error("Error getting location:", error);
            setLocationError(`Error getting location: ${error.message}`);
            // Default to a location if geolocation fails
            setCurrentLocation([13.0827, 80.2707]); // Chennai, India as default
          },
          { enableHighAccuracy: true }
        );
      }
    };
    
    getInitialLocation();
  }, []);

  // Load user preferences and saved places from database
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user) {
        try {
          // Load user preferences
          const users = await fine.table("users").select().eq("id", Number(session.user.id));
          if (users && users.length > 0) {
            const user = users[0];
            if (user.accessibilityPreferences) {
              const prefs = JSON.parse(user.accessibilityPreferences);
              setAccessibilityPreferences(prefs);
              
              // Apply UI preferences
              if (prefs.uiPreferences?.darkMode) {
                setDarkMode(true);
                document.documentElement.classList.add('dark');
              }
            }
          }
          
          // Load saved places
          const savedPlacesData = await fine.table("savedPlaces").select().eq("userId", Number(session.user.id));
          if (savedPlacesData && savedPlacesData.length > 0) {
            const placeIds = savedPlacesData.map(sp => sp.placeId);
            const places = await fine.table("places").select().in("id", placeIds);
            if (places && places.length > 0) {
              setSavedPlaces(places);
              console.log("Loaded saved places:", places);
            }
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      }
    };
    
    loadUserData();
  }, [session]);

  // Save user preferences to database
  const saveUserPreferences = async (prefs: AccessibilityPreferences) => {
    if (session?.user) {
      try {
        await fine.table("users").update({
          accessibilityPreferences: JSON.stringify(prefs)
        }).eq("id", Number(session.user.id));
      } catch (error) {
        console.error("Error saving user preferences:", error);
      }
    }
  };

  const updateCurrentLocation = (location: [number, number]) => {
    setCurrentLocation(location);
  };

  const startNavigation = () => {
    setIsNavigating(true);
    
    // Announce start of navigation if audio guidance is enabled
    if (accessibilityPreferences.routePreferences.audioGuidance && selectedRoute) {
      const firstStep = selectedRoute.steps[0];
      speakInstruction(`Starting navigation. ${firstStep.instruction}`);
      
      // Provide haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setSelectedRoute(null);
    
    // Announce end of navigation if audio guidance is enabled
    if (accessibilityPreferences.routePreferences.audioGuidance) {
      speakInstruction("Navigation stopped.");
      
      // Provide haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([400]);
      }
    }
  };

  const updateAccessibilityPreferences = (prefs: Partial<AccessibilityPreferences>) => {
    const updatedPrefs = { ...accessibilityPreferences, ...prefs };
    setAccessibilityPreferences(updatedPrefs);
    saveUserPreferences(updatedPrefs);
    
    // Apply UI preferences immediately
    if (prefs.uiPreferences?.darkMode !== undefined) {
      setDarkMode(prefs.uiPreferences.darkMode);
      if (prefs.uiPreferences.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Apply text size
    if (prefs.uiPreferences?.largeText !== undefined) {
      if (prefs.uiPreferences.largeText) {
        document.documentElement.classList.add('text-lg');
      } else {
        document.documentElement.classList.remove('text-lg');
      }
    }
    
    // Apply high contrast
    if (prefs.uiPreferences?.highContrast !== undefined) {
      if (prefs.uiPreferences.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    }
    
    // Apply reduced motion
    if (prefs.uiPreferences?.reduceMotion !== undefined) {
      if (prefs.uiPreferences.reduceMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Update accessibility preferences
    updateAccessibilityPreferences({
      uiPreferences: {
        ...accessibilityPreferences.uiPreferences,
        darkMode: newDarkMode
      }
    });
    
    // Apply dark mode
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const addSavedPlace = async (place: Schema['places']) => {
    if (!session?.user) return;
    
    try {
      // First check if the place exists in the database
      let placeId = place.id;
      
      if (!placeId) {
        // Check if a similar place already exists
        const existingPlaces = await fine.table("places").select()
          .eq("latitude", place.latitude)
          .eq("longitude", place.longitude);
        
        if (existingPlaces && existingPlaces.length > 0) {
          placeId = existingPlaces[0].id;
        } else {
          // Insert the new place
          const newPlaces = await fine.table("places").insert({
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            placeType: place.placeType,
            accessibilityFeatures: place.accessibilityFeatures,
            photos: place.photos,
            osmId: place.osmId
          }).select();
          
          if (newPlaces && newPlaces.length > 0) {
            placeId = newPlaces[0].id;
            
            // Add the new place to our local state
            setSavedPlaces(prev => [...prev, newPlaces[0]]);
          }
        }
      }
      
      if (placeId) {
        // Check if already saved
        const existing = await fine.table("savedPlaces").select()
          .eq("userId", Number(session.user.id))
          .eq("placeId", placeId);
        
        if (!existing || existing.length === 0) {
          // Save the place for the user
          await fine.table("savedPlaces").insert({
            userId: Number(session.user.id),
            placeId: placeId
          });
          
          // If the place isn't already in our local state, add it
          if (!savedPlaces.some(p => p.id === placeId)) {
            // Fetch the place details to ensure we have the complete data
            const placeDetails = await fine.table("places").select().eq("id", placeId);
            if (placeDetails && placeDetails.length > 0) {
              setSavedPlaces(prev => [...prev, placeDetails[0]]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error saving place:", error);
    }
  };

  const removeSavedPlace = async (placeId: number) => {
    if (!session?.user) return;
    
    try {
      await fine.table("savedPlaces").delete()
        .eq("userId", Number(session.user.id))
        .eq("placeId", placeId);
      
      // Update local state
      setSavedPlaces(savedPlaces.filter(p => p.id !== placeId));
    } catch (error) {
      console.error("Error removing saved place:", error);
    }
  };
  
  const startRerouting = () => {
    setIsRerouting(true);
  };
  
  const stopRerouting = () => {
    setIsRerouting(false);
  };
  
  // Find routes between two points
  const findRoutes = async (start: [number, number], end: [number, number]): Promise<Route[]> => {
    try {
      // Get accessibility preferences for routing
      const routePrefs = {
        avoidStairs: accessibilityPreferences.routePreferences.avoidStairs,
        preferRamps: accessibilityPreferences.routePreferences.preferRamps,
        preferElevators: accessibilityPreferences.routePreferences.preferElevators,
        preferSmoothTerrain: accessibilityPreferences.routePreferences.preferSmoothTerrain
      };
      
      // Find routes using A* algorithm
      const routes = await findAccessibleRoute(start, end, accessibilityPreferences);
      
      // Update available routes
      setAvailableRoutes(routes);
      
      // Select the best route based on preferences
      let bestRoute = routes[0];
      
      if (accessibilityPreferences.routePreferences.preferFewestObstacles) {
        // Sort by accessibility score (highest first)
        bestRoute = [...routes].sort((a, b) => b.accessibilityScore - a.accessibilityScore)[0];
      } else if (accessibilityPreferences.routePreferences.preferShortestRoute) {
        // Sort by distance (shortest first)
        bestRoute = [...routes].sort((a, b) => a.distance - b.distance)[0];
      }
      
      setSelectedRoute(bestRoute);
      
      return routes;
    } catch (error) {
      console.error("Error finding routes:", error);
      throw error;
    }
  };

  const value: AppState = {
    currentLocation,
    destination,
    isNavigating,
    accessibilityPreferences,
    darkMode,
    savedPlaces,
    selectedRoute,
    availableRoutes,
    transportMode,
    locationPermissionGranted,
    locationError,
    isRerouting,
    currentHeading,
    temporaryMarker,
    updateCurrentLocation,
    setCurrentLocation,
    setDestination,
    startNavigation,
    stopNavigation,
    updateAccessibilityPreferences,
    toggleDarkMode,
    addSavedPlace,
    removeSavedPlace,
    setSelectedRoute,
    setAvailableRoutes,
    setTransportMode,
    requestLocationPermission,
    setLocationError,
    startRerouting,
    stopRerouting,
    setCurrentHeading,
    setTemporaryMarker,
    findRoutes
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppState => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};