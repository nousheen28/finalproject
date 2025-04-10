import React, { useState, useEffect } from 'react';
import { Header } from '@/components/navigation/Header';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { PlaceCard } from '@/components/places/PlaceCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Coffee, Utensils, ShoppingBag, Building } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import { getNearbyAccessiblePlaces, processOsmData } from '@/lib/api';
import type { PlaceDetails } from '@/lib/api';

// Extend PlaceDetails to include distance
interface PlaceWithDistance extends PlaceDetails {
  distance?: number;
}

const NearbyPage = () => {
  const { currentLocation } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: 'All', icon: User },
    { id: 'restaurant', name: 'Food', icon: Utensils },
    { id: 'cafe', name: 'Cafes', icon: Coffee },
    { id: 'shop', name: 'Shops', icon: ShoppingBag },
    { id: 'public', name: 'Public', icon: Building },
  ];

  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      if (!currentLocation) return;
      
      setIsLoading(true);
      try {
        const [lat, lng] = currentLocation;
        
        // Get amenities based on selected category
        const amenities = activeCategory === 'all' 
          ? ['restaurant', 'cafe', 'shop', 'school', 'hospital', 'library', 'theatre', 'cinema']
          : activeCategory === 'public'
            ? ['school', 'hospital', 'library', 'theatre', 'cinema', 'townhall', 'police']
            : [activeCategory];
        
        const placesData = await getNearbyAccessiblePlaces(lat, lng, 1000, amenities);
        
        // Process the OSM data to extract accessibility information
        const processedPlaces = placesData
          .map(processOsmData)
          .filter(Boolean) as PlaceDetails[];
        
        // Calculate distance from current location
        const placesWithDistance = processedPlaces.map(place => {
          const distance = calculateDistance(
            currentLocation[0], 
            currentLocation[1], 
            place.coordinates[0], 
            place.coordinates[1]
          );
          return { ...place, distance };
        });
        
        // Sort by distance
        placesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setPlaces(placesWithDistance);
      } catch (error) {
        console.error("Error fetching nearby places:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbyPlaces();
  }, [currentLocation, activeCategory]);

  // Calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  return (
    <main className="w-full min-h-screen bg-background text-foreground pb-16">
      <Header title="Nearby Places" />
      
      <div className="p-4">
        {/* Category tabs */}
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full mb-4 overflow-x-auto flex no-scrollbar">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="flex-1">
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeCategory}>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : places.length > 0 ? (
              <div className="space-y-4">
                {places.map((place) => (
                  <PlaceCard 
                    key={place.id} 
                    place={place} 
                    distance={place.distance}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No accessible places found nearby</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveCategory('all')}
                >
                  Show all places
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <NavigationBar />
    </main>
  );
};

export default NearbyPage;