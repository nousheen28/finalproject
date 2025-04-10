import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin } from 'lucide-react';

interface RouteOption {
  id: string;
  duration: number; // in minutes
  distance: number; // in meters
  accessibilityScore: number; // 0-100
  description: string;
}

interface RouteOptionsProps {
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  onStartNavigation: () => void;
}

export const RouteOptions: React.FC<RouteOptionsProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onStartNavigation,
}) => {
  // Sort routes by accessibility score (highest first)
  const sortedRoutes = [...routes].sort((a, b) => b.accessibilityScore - a.accessibilityScore);
  
  return (
    <div className="route-options space-y-4">
      <h2 className="text-lg font-semibold mb-2">Route Options</h2>
      
      {sortedRoutes.map((route) => (
        <Card 
          key={route.id}
          className={`cursor-pointer transition-all ${
            selectedRouteId === route.id ? 'border-primary' : ''
          }`}
          onClick={() => onSelectRoute(route.id)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {route.accessibilityScore >= 80 && (
                  <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-1 rounded-full mr-2">
                    <div className="h-4 w-4 flex items-center justify-center">♿</div>
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{route.description}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    <span className="mr-3">{route.duration} min</span>
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{(route.distance / 1000).toFixed(1)} km</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="text-sm font-medium">
                  Accessibility
                </div>
                <div className="w-16 h-2 bg-muted rounded-full mt-1">
                  <div 
                    className="h-full rounded-full bg-primary" 
                    style={{ width: `${route.accessibilityScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {selectedRouteId && (
        <Button 
          className="w-full mt-4" 
          onClick={onStartNavigation}
        >
          Start Navigation
        </Button>
      )}
    </div>
  );
};