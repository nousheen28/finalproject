import { AccessibilityPreferences } from './accessibility-types';

// Node for A* algorithm
interface Node {
  lat: number;
  lng: number;
  g: number; // Cost from start to current node
  h: number; // Heuristic (estimated cost from current to goal)
  f: number; // Total cost (g + h)
  parent: Node | null;
  hasElevator: boolean;
  hasRamp: boolean;
  hasStairs: boolean;
  width: number; // Path width in meters
  slope: number; // Path slope in percentage
  surface: string; // Surface type (e.g., "paved", "gravel", "asphalt")
}

// Calculate distance between two points in meters (Haversine formula)
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Heuristic function for A* (straight-line distance)
const heuristic = (node: Node, goal: Node): number => {
  return calculateDistance(node.lat, node.lng, goal.lat, goal.lng);
};

// Get accessible neighbors for a node
const getNeighbors = async (node: Node, map: any, preferences: AccessibilityPreferences): Promise<Node[]> => {
  // In a real implementation, this would query OpenStreetMap for actual paths
  // For this demo, we'll generate some sample neighbors
  
  // Directions to check (N, NE, E, SE, S, SW, W, NW)
  const directions = [
    [0.0001, 0], [0.0001, 0.0001], [0, 0.0001], [-0.0001, 0.0001],
    [-0.0001, 0], [-0.0001, -0.0001], [0, -0.0001], [0.0001, -0.0001]
  ];
  
  const neighbors: Node[] = [];
  
  for (const [latOffset, lngOffset] of directions) {
    const newLat = node.lat + latOffset;
    const newLng = node.lng + lngOffset;
    
    // Simulate checking if this path is accessible based on preferences
    // In a real implementation, this would check actual map data
    
    // Random properties for demo purposes
    const hasElevator = Math.random() > 0.8;
    const hasRamp = Math.random() > 0.6;
    const hasStairs = Math.random() > 0.5;
    const width = 1 + Math.random() * 3; // 1-4 meters
    const slope = Math.random() * 10; // 0-10%
    const surfaces = ["paved", "asphalt", "concrete", "gravel", "dirt"];
    const surface = surfaces[Math.floor(Math.random() * surfaces.length)];
    
    // Check if this neighbor meets accessibility requirements
    let isAccessible = true;
    
    // Check wheelchair accessibility
    if (preferences.disabilityTypes.includes('wheelchair') || 
        preferences.mobilityAid === 'manual_wheelchair' || 
        preferences.mobilityAid === 'power_wheelchair') {
      
      if (preferences.routePreferences.avoidStairs && hasStairs && !hasRamp && !hasElevator) {
        isAccessible = false;
      }
      
      if (preferences.routePreferences.maxSlope && slope > preferences.routePreferences.maxSlope) {
        isAccessible = false;
      }
      
      if (preferences.routePreferences.minWidth && width < preferences.routePreferences.minWidth) {
        isAccessible = false;
      }
      
      if (preferences.routePreferences.preferSmoothTerrain && 
          (surface === "gravel" || surface === "dirt")) {
        isAccessible = false;
      }
    }
    
    if (isAccessible) {
      // Calculate cost based on distance and accessibility features
      let cost = calculateDistance(node.lat, node.lng, newLat, newLng);
      
      // Adjust cost based on accessibility preferences
      if (preferences.routePreferences.preferElevators && hasElevator) {
        cost *= 0.8; // Reduce cost if elevators are preferred and available
      }
      
      if (preferences.routePreferences.preferRamps && hasRamp) {
        cost *= 0.9; // Reduce cost if ramps are preferred and available
      }
      
      if (preferences.routePreferences.avoidStairs && hasStairs) {
        cost *= 1.5; // Increase cost if stairs should be avoided
      }
      
      if (preferences.routePreferences.preferSmoothTerrain && 
          (surface === "paved" || surface === "asphalt" || surface === "concrete")) {
        cost *= 0.9; // Reduce cost for smooth terrain
      }
      
      neighbors.push({
        lat: newLat,
        lng: newLng,
        g: node.g + cost,
        h: 0, // Will be calculated later
        f: 0, // Will be calculated later
        parent: node,
        hasElevator,
        hasRamp,
        hasStairs,
        width,
        slope,
        surface
      });
    }
  }
  
  return neighbors;
};

// A* algorithm for finding accessible routes
export const findAccessibleRoute = async (
  startLat: number, 
  startLng: number, 
  goalLat: number, 
  goalLng: number,
  map: any, // Map data source
  preferences: AccessibilityPreferences
): Promise<[number, number][]> => {
  // Create start and goal nodes
  const startNode: Node = {
    lat: startLat,
    lng: startLng,
    g: 0,
    h: 0,
    f: 0,
    parent: null,
    hasElevator: false,
    hasRamp: false,
    hasStairs: false,
    width: 2,
    slope: 0,
    surface: "paved"
  };
  
  const goalNode: Node = {
    lat: goalLat,
    lng: goalLng,
    g: 0,
    h: 0,
    f: 0,
    parent: null,
    hasElevator: false,
    hasRamp: false,
    hasStairs: false,
    width: 2,
    slope: 0,
    surface: "paved"
  };
  
  // Calculate heuristic for start node
  startNode.h = heuristic(startNode, goalNode);
  startNode.f = startNode.g + startNode.h;
  
  // Initialize open and closed sets
  const openSet: Node[] = [startNode];
  const closedSet: Node[] = [];
  
  // Maximum iterations to prevent infinite loops
  const maxIterations = 1000;
  let iterations = 0;
  
  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Find node with lowest f score in open set
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }
    
    const currentNode = openSet[currentIndex];
    
    // Check if we've reached the goal
    if (calculateDistance(currentNode.lat, currentNode.lng, goalNode.lat, goalNode.lng) < 20) {
      // Reconstruct path
      const path: [number, number][] = [];
      let current: Node | null = currentNode;
      
      while (current) {
        path.unshift([current.lat, current.lng]);
        current = current.parent;
      }
      
      return path;
    }
    
    // Move current node from open to closed set
    openSet.splice(currentIndex, 1);
    closedSet.push(currentNode);
    
    // Get neighbors
    const neighbors = await getNeighbors(currentNode, map, preferences);
    
    for (const neighbor of neighbors) {
      // Skip if neighbor is in closed set
      if (closedSet.some(node => 
        Math.abs(node.lat - neighbor.lat) < 0.00001 && 
        Math.abs(node.lng - neighbor.lng) < 0.00001)) {
        continue;
      }
      
      // Calculate f, g, h scores
      neighbor.h = heuristic(neighbor, goalNode);
      neighbor.f = neighbor.g + neighbor.h;
      
      // Check if neighbor is already in open set with a better path
      const openNeighbor = openSet.find(node => 
        Math.abs(node.lat - neighbor.lat) < 0.00001 && 
        Math.abs(node.lng - neighbor.lng) < 0.00001);
      
      if (openNeighbor && neighbor.g >= openNeighbor.g) {
        continue;
      }
      
      // Add neighbor to open set
      if (!openNeighbor) {
        openSet.push(neighbor);
      } else {
        // Update existing node with better path
        openNeighbor.g = neighbor.g;
        openNeighbor.f = neighbor.f;
        openNeighbor.parent = neighbor.parent;
      }
    }
  }
  
  // If we get here, no path was found
  console.log("No accessible path found after", iterations, "iterations");
  
  // Return direct path as fallback
  return [
    [startLat, startLng],
    [goalLat, goalLng]
  ];
};