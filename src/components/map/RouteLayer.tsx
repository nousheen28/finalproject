import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AccessibilityPreferences } from '@/lib/accessibility-types';
import type { Route } from '@/lib/api';

interface RouteLayerProps {
  map: L.Map;
  route: Route;
  accessibilityPreferences: AccessibilityPreferences;
  highContrast?: boolean;
}

export const RouteLayer: React.FC<RouteLayerProps> = ({ 
  map, 
  route,
  accessibilityPreferences,
  highContrast = false
}) => {
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Clear previous route and markers
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Create route polyline
    if (route && route.waypoints) {
      // Determine route color based on accessibility preferences and high contrast
      let routeColor = '#3b82f6'; // Default blue
      let routeWeight = 6;
      let routeOpacity = 0.7;
      
      if (highContrast) {
        routeColor = '#000000'; // Black for high contrast
        routeWeight = 8;
        routeOpacity = 1;
      } else if (route.accessibilityScore >= 90) {
        routeColor = '#22c55e'; // Green for highly accessible routes
      } else if (route.accessibilityScore >= 70) {
        routeColor = '#3b82f6'; // Blue for moderately accessible routes
      } else {
        routeColor = '#f59e0b'; // Yellow for less accessible routes
      }
      
      // Convert waypoints to LatLng objects
      const latLngWaypoints = route.waypoints.map(waypoint => 
        [waypoint[0], waypoint[1]]
      );
      
      routeLayerRef.current = L.polyline(latLngWaypoints as L.LatLngTuple[], {
        color: routeColor,
        weight: routeWeight,
        opacity: routeOpacity,
        lineJoin: 'round'
      }).addTo(map);

      // Fit map to show the entire route
      map.fitBounds(routeLayerRef.current.getBounds(), {
        padding: [50, 50]
      });

      // Add start marker
      const startIcon = L.divIcon({
        className: 'start-marker',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full ${highContrast ? 'bg-black text-white' : 'bg-green-500 text-white'} border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const startMarker = L.marker([route.waypoints[0][0], route.waypoints[0][1]], { icon: startIcon })
        .addTo(map);
      
      // Add tooltip to start marker
      startMarker.bindTooltip('Start', { 
        permanent: highContrast, 
        direction: 'top',
        className: highContrast ? 'high-contrast-tooltip' : ''
      });
      
      markersRef.current.push(startMarker);

      // Add end marker
      const endIcon = L.divIcon({
        className: 'end-marker',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full ${highContrast ? 'bg-black text-white' : 'bg-red-500 text-white'} border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="8 12 12 16 16 12"></polyline>
              <line x1="12" y1="8" x2="12" y2="16"></line>
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const lastWaypoint = route.waypoints[route.waypoints.length - 1];
      const endMarker = L.marker([lastWaypoint[0], lastWaypoint[1]], { icon: endIcon })
        .addTo(map);
      
      // Add tooltip to end marker
      endMarker.bindTooltip('Destination', { 
        permanent: highContrast, 
        direction: 'top',
        className: highContrast ? 'high-contrast-tooltip' : ''
      });
      
      markersRef.current.push(endMarker);
      
      // Add waypoint markers for key turns if high contrast is enabled
      if (highContrast || accessibilityPreferences.uiPreferences.alwaysShowLabels) {
        route.steps.forEach((step, index) => {
          if (index > 0 && index < route.steps.length - 1 && step.maneuver) {
            const waypointIcon = L.divIcon({
              className: 'waypoint-marker',
              html: `
                <div class="flex items-center justify-center w-6 h-6 rounded-full ${highContrast ? 'bg-yellow-500 border-2 border-black text-black' : 'bg-blue-500 text-white border-2 border-white'}">
                  ${index + 1}
                </div>
              `,
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            });
            
            // Use the waypoint from the step if available, otherwise use an interpolated point
            if (step.waypoint) {
              const waypointMarker = L.marker([step.waypoint[0], step.waypoint[1]], { icon: waypointIcon })
                .addTo(map);
              
              // Add tooltip to waypoint marker
              waypointMarker.bindTooltip(step.instruction, { 
                permanent: false, 
                direction: 'top',
                className: highContrast ? 'high-contrast-tooltip' : ''
              });
              
              markersRef.current.push(waypointMarker);
            }
          }
        });
      }
      
      // Add accessibility feature markers along the route
      if (route.steps.some(step => step.maneuver === 'elevator' || step.maneuver === 'ramp')) {
        route.steps.forEach((step, index) => {
          if (step.maneuver === 'elevator' || step.maneuver === 'ramp') {
            const featureIcon = L.divIcon({
              className: 'feature-marker',
              html: `
                <div class="flex items-center justify-center w-8 h-8 rounded-full ${
                  step.maneuver === 'elevator' 
                    ? (highContrast ? 'bg-black text-white' : 'bg-purple-500 text-white') 
                    : (highContrast ? 'bg-black text-white' : 'bg-green-500 text-white')
                } border-2 border-white">
                  ${step.maneuver === 'elevator' ? '🔼' : '⤴️'}
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            
            if (step.waypoint) {
              const featureMarker = L.marker([step.waypoint[0], step.waypoint[1]], { icon: featureIcon })
                .addTo(map);
              
              // Add tooltip to feature marker
              featureMarker.bindTooltip(
                step.maneuver === 'elevator' ? 'Elevator' : 'Ramp', 
                { 
                  permanent: highContrast, 
                  direction: 'top',
                  className: highContrast ? 'high-contrast-tooltip' : ''
                }
              );
              
              markersRef.current.push(featureMarker);
            }
          }
        });
      }
    }

    // Cleanup on unmount
    return () => {
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
      }
      markersRef.current.forEach(marker => map.removeLayer(marker));
    };
  }, [map, route, accessibilityPreferences, highContrast]);

  return null; // This is a non-visual component that manipulates the map
};