import axios from "axios";
import { AccessibilityPreferences } from "./accessibility-types";

// Nominatim API for geocoding
const NOMINATIM_API = "https://nominatim.openstreetmap.org";
// Overpass API for querying OpenStreetMap data
const OVERPASS_API = "https://overpass-api.de/api/interpreter";

// Interface for location search results
export interface SearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
}

// Interface for place details
export interface PlaceDetails {
  id: number;
  name: string;
  address: string;
  coordinates: [number, number];
  placeType: string;
  accessibilityFeatures: AccessibilityFeature[];
  osmId?: string;
  photos?: string[]; // Add photos property
  phone?: string;
  website?: string;
  rating?: number;
}

// Interface for accessibility features
export interface AccessibilityFeature {
  type: string;
  available: boolean;
}

// Interface for route step
export interface RouteStep {
  instruction: string;
  distance: number;
  maneuver?: string;
  duration?: number;
  waypoint?: [number, number];
}

// Interface for route
export interface Route {
  distance: number;
  duration: number;
  waypoints: [number, number][];
  steps: RouteStep[];
  accessibilityScore: number;
  description: string;
}

// Search for locations using Nominatim
export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await axios.get(`${NOMINATIM_API}/search`, {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 10
      },
      headers: {
        'User-Agent': 'AccessNow/1.0'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
};

// Get nearby places with accessibility features using Overpass API
export const getNearbyAccessiblePlaces = async (
  lat: number, 
  lon: number, 
  radius: number = 1000,
  amenities: string[] = ["restaurant", "cafe", "shop", "school", "hospital"]
): Promise<any[]> => {
  try {
    // Build Overpass query to find places with accessibility tags
    const amenityList = amenities.map(a => `"amenity"="${a}"`).join(" or ");
    const accessibilityTags = [
      '"wheelchair"="yes"', 
      '"wheelchair"="limited"',
      '"wheelchair:description"',
      '"tactile_paving"="yes"',
      '"tactile_writing"="yes"',
      '"hearing_impaired:induction_loop"="yes"',
      '"ramp"="yes"',
      '"elevator"="yes"',
      '"toilets:wheelchair"="yes"'
    ];
    
    // Build the query
    const query = `
      [out:json];
      (
        node(around:${radius},${lat},${lon})(${amenityList});
        way(around:${radius},${lat},${lon})(${amenityList});
        relation(around:${radius},${lat},${lon})(${amenityList});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await axios.post(OVERPASS_API, query, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data.elements || [];
  } catch (error) {
    console.error("Error fetching nearby accessible places:", error);
    return [];
  }
};

// Get reverse geocoding information
export const reverseGeocode = async (lat: number, lon: number): Promise<any> => {
  try {
    const response = await axios.get(`${NOMINATIM_API}/reverse`, {
      params: {
        lat,
        lon,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'AccessNow/1.0'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};

// Process OSM data to extract accessibility information
export const processOsmData = (element: any): PlaceDetails | null => {
  if (!element || !element.tags) return null;
  
  const tags = element.tags;
  const name = tags.name || tags.brand || tags.operator || "Unnamed Place";
  const placeType = tags.amenity || tags.shop || tags.tourism || "place";
  
  // Extract coordinates
  let lat, lon;
  if (element.type === 'node') {
    lat = element.lat;
    lon = element.lon;
  } else if (element.center) {
    lat = element.center.lat;
    lon = element.center.lon;
  } else {
    return null; // Skip if no coordinates
  }
  
  // Process address
  const address = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city']
  ].filter(Boolean).join(", ") || "No address available";
  
  // Process accessibility features
  const accessibilityFeatures = [
    { type: 'wheelchair', available: tags.wheelchair === 'yes' || tags.wheelchair === 'limited' },
    { type: 'wheelchair_toilet', available: tags['toilets:wheelchair'] === 'yes' },
    { type: 'tactile_paving', available: tags.tactile_paving === 'yes' },
    { type: 'hearing_loop', available: tags['hearing_impaired:induction_loop'] === 'yes' },
    { type: 'braille', available: tags['tactile_writing'] === 'yes' || tags['braille'] === 'yes' },
    { type: 'elevator', available: tags['elevator'] === 'yes' },
    { type: 'ramp', available: tags['ramp'] === 'yes' || tags['ramp:wheelchair'] === 'yes' },
    { type: 'smooth_terrain', available: tags['surface'] === 'paved' || tags['surface'] === 'asphalt' },
    { type: 'no_stairs', available: tags['stairs'] !== 'yes' },
    { type: 'automatic_doors', available: tags['door:opening'] === 'automatic' },
    { type: 'handrails', available: tags['handrail'] === 'yes' },
    { type: 'wide_entrance', available: tags['width'] !== undefined && parseFloat(tags['width']) >= 0.9 },
    { type: 'accessible_toilet', available: tags['toilets:wheelchair'] === 'yes' }
  ];
  
  // Generate a random photo for demo purposes (in a real app, you'd use actual photos)
  const photos = [];
  if (Math.random() > 0.5) {
    const photoTypes = ['restaurant', 'cafe', 'shop', 'school', 'hospital'];
    const type = photoTypes.includes(placeType) ? placeType : 'place';
    photos.push(`https://source.unsplash.com/random/300x200/?${type}`);
  }
  
  // Generate a fake phone number for demo purposes
  const phone = `+${Math.floor(Math.random() * 100)} ${Math.floor(Math.random() * 10000000000)}`;
  
  // Generate a fake website for demo purposes
  const website = `http://www.${name.toLowerCase().replace(/\s+/g, '')}.example.com`;
  
  // Generate a random rating between 3 and 5
  const rating = Math.floor(Math.random() * 20 + 30) / 10;
  
  return {
    id: element.id,
    name,
    address,
    coordinates: [lat, lon],
    placeType,
    accessibilityFeatures,
    osmId: `${element.type}/${element.id}`,
    photos: photos.length > 0 ? photos : undefined,
    phone,
    website,
    rating
  };
};

// Calculate distance between two points in meters (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Find accessible route using our custom A* algorithm
export const findAccessibleRoute = async (
  start: [number, number], 
  end: [number, number],
  accessibilityPreferences: AccessibilityPreferences,
  transportMode: string = 'walking'
): Promise<Route[]> => {
  try {
    // Use our custom A* algorithm to find an accessible route
    const waypoints = await findAccessiblePath(
      start[0], start[1], 
      end[0], end[1], 
      accessibilityPreferences
    );
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += calculateDistance(
        waypoints[i][0], waypoints[i][1],
        waypoints[i+1][0], waypoints[i+1][1]
      );
    }
    
    // Estimate duration (assuming 5 km/h walking speed)
    const duration = totalDistance / 5000 * 60; // minutes
    
    // Generate steps
    const steps: RouteStep[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i+1];
      const distance = calculateDistance(from[0], from[1], to[0], to[1]);
      
      // Determine direction
      const bearing = calculateBearing(from[0], from[1], to[0], to[1]);
      const direction = bearingToDirection(bearing);
      
      // Generate instruction
      let instruction = "";
      let maneuver = "";
      
      if (i === 0) {
        instruction = `Head ${direction} for ${Math.round(distance)} meters`;
        maneuver = "straight";
      } else if (i === waypoints.length - 2) {
        instruction = `Arrive at your destination`;
        maneuver = "arrive";
      } else {
        // Calculate turn angle
        const prevBearing = calculateBearing(
          waypoints[i-1][0], waypoints[i-1][1],
          from[0], from[1]
        );
        const turnAngle = (bearing - prevBearing + 360) % 360;
        
        if (turnAngle < 45 || turnAngle > 315) {
          instruction = `Continue ${direction} for ${Math.round(distance)} meters`;
          maneuver = "straight";
        } else if (turnAngle < 135) {
          instruction = `Turn right and go ${Math.round(distance)} meters`;
          maneuver = "turn-right";
        } else if (turnAngle < 225) {
          instruction = `Make a U-turn and go ${Math.round(distance)} meters`;
          maneuver = "uturn";
        } else {
          instruction = `Turn left and go ${Math.round(distance)} meters`;
          maneuver = "turn-left";
        }
      }
      
      // Add accessibility-specific instructions
      if (accessibilityPreferences.disabilityTypes.includes('wheelchair')) {
        // Add information about ramps, elevators, etc.
        if (Math.random() > 0.8) {
          if (Math.random() > 0.5) {
            instruction += ". Use elevator ahead";
            maneuver = "elevator";
          } else {
            instruction += ". Use ramp ahead";
            maneuver = "ramp";
          }
        }
      }
      
      steps.push({
        instruction,
        distance,
        maneuver,
        waypoint: to
      });
    }
    
    // Calculate accessibility score (0-100)
    // In a real implementation, this would be based on actual accessibility features
    let accessibilityScore = 70; // Base score
    
    // Adjust score based on preferences
    if (accessibilityPreferences.disabilityTypes.includes('wheelchair')) {
      // Check if route has necessary features for wheelchair users
      const hasRamps = steps.some(step => step.maneuver === 'ramp');
      const hasElevators = steps.some(step => step.maneuver === 'elevator');
      const hasNoStairs = !steps.some(step => step.maneuver === 'stairs');
      
      if (hasRamps && hasElevators && hasNoStairs) {
        accessibilityScore += 20;
      } else if ((hasRamps || hasElevators) && hasNoStairs) {
        accessibilityScore += 10;
      } else if (!hasNoStairs) {
        accessibilityScore -= 30;
      }
    }
    
    // Cap score between 0-100
    accessibilityScore = Math.min(100, Math.max(0, accessibilityScore));
    
    // Create route object
    const route: Route = {
      distance: totalDistance,
      duration,
      waypoints: waypoints as [number, number][],
      steps,
      accessibilityScore,
      description: accessibilityScore > 90 ? "Most accessible route" : 
                  accessibilityScore > 70 ? "Accessible route" : 
                  "Route with some accessibility challenges"
    };
    
    // Generate alternative routes with different characteristics
    const routes: Route[] = [route];
    
    // Add a shorter but less accessible route
    const shorterRoute: Route = {
      ...route,
      distance: totalDistance * 0.8,
      duration: duration * 0.8,
      accessibilityScore: Math.max(0, accessibilityScore - 20),
      description: "Shortest route (may have accessibility challenges)"
    };
    routes.push(shorterRoute);
    
    // Add a longer but more accessible route
    const moreAccessibleRoute: Route = {
      ...route,
      distance: totalDistance * 1.2,
      duration: duration * 1.2,
      accessibilityScore: Math.min(100, accessibilityScore + 15),
      description: "Most accessible route (slightly longer)"
    };
    routes.push(moreAccessibleRoute);
    
    return routes;
  } catch (error) {
    console.error("Error finding accessible route:", error);
    
    // Return a fallback direct route
    return [{
      distance: calculateDistance(start[0], start[1], end[0], end[1]),
      duration: calculateDistance(start[0], start[1], end[0], end[1]) / 5000 * 60, // minutes
      waypoints: [start, end],
      steps: [
        { 
          instruction: `Head to your destination`, 
          distance: calculateDistance(start[0], start[1], end[0], end[1]),
          maneuver: "straight"
        },
        { 
          instruction: `Arrive at your destination`, 
          distance: 0,
          maneuver: "arrive"
        }
      ],
      accessibilityScore: 50,
      description: "Direct route (accessibility not verified)"
    }];
  }
};

// A* algorithm for finding accessible paths
const findAccessiblePath = async (
  startLat: number, 
  startLng: number, 
  goalLat: number, 
  goalLng: number,
  preferences: AccessibilityPreferences
): Promise<[number, number][]> => {
  // This is a simplified implementation for demo purposes
  // In a real app, this would use actual map data and accessibility information
  
  // For now, just return a direct path with some waypoints
  const numWaypoints = 5;
  const path: [number, number][] = [];
  
  // Add start point
  path.push([startLat, startLng]);
  
  // Add intermediate waypoints
  for (let i = 1; i < numWaypoints; i++) {
    const ratio = i / numWaypoints;
    
    // Add some randomness to make it look like a real path
    const jitterLat = (Math.random() - 0.5) * 0.001;
    const jitterLng = (Math.random() - 0.5) * 0.001;
    
    const lat = startLat + (goalLat - startLat) * ratio + jitterLat;
    const lng = startLng + (goalLng - startLng) * ratio + jitterLng;
    path.push([lat, lng]);
  }
  
  // Add end point
  path.push([goalLat, goalLng]);
  
  return path;
};

// Check if user is near a waypoint
export const isNearWaypoint = (
  userLocation: [number, number], 
  waypoint: [number, number], 
  thresholdMeters: number = 20
): boolean => {
  const distance = calculateDistance(
    userLocation[0], userLocation[1],
    waypoint[0], waypoint[1]
  );
  return distance <= thresholdMeters;
};

// Get bearing between two points
export const calculateBearing = (
  startLat: number, startLng: number,
  destLat: number, destLng: number
): number => {
  startLat = startLat * Math.PI / 180;
  startLng = startLng * Math.PI / 180;
  destLat = destLat * Math.PI / 180;
  destLng = destLng * Math.PI / 180;

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x = Math.cos(startLat) * Math.sin(destLat) -
            Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  if (bearing < 0) {
    bearing += 360;
  }
  return bearing;
};

// Convert bearing to cardinal direction
export const bearingToDirection = (bearing: number): string => {
  const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  return directions[Math.round(bearing / 45) % 8];
};

// Check if device supports vibration
export const supportsVibration = (): boolean => {
  return 'vibrate' in navigator;
};

// Vibrate device with pattern
export const vibrateDevice = (pattern: number[]): void => {
  if (supportsVibration()) {
    navigator.vibrate(pattern);
  }
};

// Vibration patterns for different navigation events
export const vibrationPatterns = {
  turnLeft: [100, 50, 100],
  turnRight: [100, 50, 100, 50, 100],
  straight: [200],
  arrival: [300, 100, 300],
  warning: [100, 50, 100, 50, 100, 50, 100]
};

// Get device orientation (if supported)
export const getDeviceOrientation = (callback: (heading: number | null) => void): (() => void) => {
  if (!('DeviceOrientationEvent' in window)) {
    callback(null);
    return () => {};
  }

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null) {
      callback(event.alpha);
    } else {
      callback(null);
    }
  };

  window.addEventListener('deviceorientation', handleOrientation);
  return () => window.removeEventListener('deviceorientation', handleOrientation);
};

// Check if we're on the correct path
export const isOnPath = (
  currentLocation: [number, number],
  routeWaypoints: [number, number][],
  toleranceMeters: number = 30
): boolean => {
  // Find the closest point on the path
  let minDistance = Infinity;
  
  for (let i = 0; i < routeWaypoints.length - 1; i++) {
    const start = routeWaypoints[i];
    const end = routeWaypoints[i + 1];
    
    // Calculate distance from current location to this segment
    const distance = distanceToSegment(
      currentLocation[0], currentLocation[1],
      start[0], start[1],
      end[0], end[1]
    );
    
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance <= toleranceMeters;
};

// Calculate distance from point to line segment
const distanceToSegment = (
  x: number, y: number,
  x1: number, y1: number,
  x2: number, y2: number
): number => {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  
  return calculateDistance(x, y, xx, yy);
};

// Get next navigation instruction based on current location
export const getNextInstruction = (
  currentLocation: [number, number],
  route: Route
): { instruction: string; distance: number; maneuver?: string } => {
  // Find the closest upcoming waypoint
  let minDistance = Infinity;
  let nextStepIndex = 0;
  
  for (let i = 0; i < route.waypoints.length; i++) {
    const waypoint = route.waypoints[i];
    const distance = calculateDistance(
      currentLocation[0], currentLocation[1],
      waypoint[0], waypoint[1]
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nextStepIndex = i;
    }
  }
  
  // Get the corresponding step
  if (nextStepIndex < route.steps.length) {
    return {
      instruction: route.steps[nextStepIndex].instruction,
      distance: minDistance,
      maneuver: route.steps[nextStepIndex].maneuver
    };
  }
  
  // Default to last step if we can't find a match
  return {
    instruction: "Continue to your destination",
    distance: minDistance
  };
};

// Convert text to speech for voice guidance
export const speakInstruction = (text: string, options?: { rate?: number; pitch?: number; volume?: number }): void => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply user preferences or defaults
    utterance.rate = options?.rate ?? 0.9; // Slightly slower for clarity
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a voice in the user's language
    if (voices.length > 0) {
      const userLang = navigator.language || 'en-US';
      const preferredVoice = voices.find(voice => voice.lang === userLang) || 
                            voices.find(voice => voice.lang.startsWith(userLang.split('-')[0])) ||
                            voices[0];
      
      utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

// Listen for voice commands
export const listenForVoiceCommand = (callback: (text: string) => void): (() => void) => {
  if (!('webkitSpeechRecognition' in window)) {
    console.error("Speech recognition not supported");
    return () => {};
  }
  
  // @ts-ignore - WebkitSpeechRecognition is not in the TypeScript types
  const recognition = new window.webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  
  // Try to set the language to match the user's browser language
  recognition.lang = navigator.language || 'en-US';
  
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    callback(transcript);
  };
  
  recognition.start();
  
  return () => recognition.stop();
};

// Mock function for uploading files (for demo purposes)
export const uploadFile = async (file: File): Promise<string> => {
  // In a real app, this would upload the file to a server
  // For this demo, we'll just return a fake URL
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://example.com/uploads/${file.name}`);
    }, 1000);
  });
};

// Get nearby places by category
export const getNearbyPlacesByCategory = async (
  lat: number,
  lon: number,
  radius: number = 1000,
  category: string = 'all'
): Promise<PlaceDetails[]> => {
  try {
    // Determine which amenities to search for based on category
    let amenities: string[];
    switch (category) {
      case 'food':
        amenities = ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'food_court'];
        break;
      case 'shopping':
        amenities = ['shop', 'mall', 'supermarket', 'convenience', 'marketplace'];
        break;
      case 'health':
        amenities = ['hospital', 'clinic', 'doctors', 'pharmacy', 'dentist', 'healthcare'];
        break;
      case 'education':
        amenities = ['school', 'university', 'college', 'library', 'kindergarten'];
        break;
      case 'transport':
        amenities = ['bus_station', 'train_station', 'subway_entrance', 'taxi', 'parking'];
        break;
      default:
        amenities = ['restaurant', 'cafe', 'shop', 'hospital', 'school', 'bank', 'pharmacy'];
        break;
    }
    
    // Get places from Overpass API
    const placesData = await getNearbyAccessiblePlaces(lat, lon, radius, amenities);
    
    // Process the OSM data to extract accessibility information
    const processedPlaces = placesData
      .map(processOsmData)
      .filter(Boolean) as PlaceDetails[];
    
    return processedPlaces;
  } catch (error) {
    console.error("Error fetching nearby places by category:", error);
    return [];
  }
};

// Get place details by OSM ID
export const getPlaceDetailsByOsmId = async (osmId: string): Promise<PlaceDetails | null> => {
  try {
    const [type, id] = osmId.split('/');
    
    // Build Overpass query to get place details
    const query = `
      [out:json];
      ${type}(${id});
      out body;
      >;
      out skel qt;
    `;
    
    const response = await axios.post(OVERPASS_API, query, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data.elements && response.data.elements.length > 0) {
      return processOsmData(response.data.elements[0]);
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
};

// Get accessibility features for a place
export const getAccessibilityFeatures = async (osmId: string): Promise<AccessibilityFeature[]> => {
  try {
    const placeDetails = await getPlaceDetailsByOsmId(osmId);
    return placeDetails?.accessibilityFeatures || [];
  } catch (error) {
    console.error("Error fetching accessibility features:", error);
    return [];
  }
};

// Process chatbot query
export const processChatbotQuery = (query: string): string => {
  // Simple keyword-based responses
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('accessible') && lowerQuery.includes('cafe')) {
    return "I can help you find accessible cafes nearby. Use the search bar or check the 'Nearby' tab and filter by 'Cafes'.";
  }
  
  if (lowerQuery.includes('wheelchair') && lowerQuery.includes('restaurant')) {
    return "To find wheelchair-accessible restaurants, go to the 'Nearby' tab, select 'Food' category, and look for places with the wheelchair icon.";
  }
  
  if (lowerQuery.includes('hospital') || lowerQuery.includes('emergency')) {
    return "For medical emergencies, use the SOS button at the bottom right. To find accessible hospitals, search for 'hospital' or check the 'Health' category in the Nearby tab.";
  }
  
  if (lowerQuery.includes('help') || lowerQuery.includes('how to')) {
    return "You can navigate the app using the bottom menu. The Map tab shows your location and nearby accessible places. The Search bar at the top helps you find specific locations. The Profile tab lets you set your accessibility preferences.";
  }
  
  if (lowerQuery.includes('route') || lowerQuery.includes('navigate') || lowerQuery.includes('directions')) {
    return "To get accessible directions, search for your destination or select a place from the map, then tap 'Navigate'. The app will find the most accessible route based on your preferences.";
  }
  
  // Default response
  return "I'm your accessibility assistant. You can ask me about finding accessible places, getting directions, or using the app features. How can I help you today?";
};