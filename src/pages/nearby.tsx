import React, { useState, useEffect } from 'react';
import { Header } from '@/components/navigation/Header';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { PlaceCard } from '@/components/places/PlaceCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Coffee, Utensils, ShoppingBag, Building, Stethoscope, BookOpen } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import { getNearbyPlacesByCategory, calculateDistance } from '@/lib/api';
import type { PlaceDetails } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

// Extend PlaceDetails to include distance
interface PlaceWithDistance extends PlaceDetails {
  distance?: number;
}

const NearbyPage = () => {
  const { currentLocation, accessibilityPreferences } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: 'All', icon: User },
    { id: 'food', name: 'Food', icon: Utensils },
    { id: 'shopping', name: 'Shops', icon: ShoppingBag },
    { id: 'health', name: 'Health', icon: Stethoscope },
    { id: 'education', name: 'Education', icon: BookOpen },
    { id: 'public', name: 'Public', icon: Building },
  ];

  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      if (!currentLocation) return;
      
      setIsLoading(true);
      try {
        const [lat, lng] = currentLocation;
        
        // Get places by category
        const placesData = await getNearbyPlacesByCategory(lat, lng, 1000, activeCategory);
        
        // Calculate distance from current location
        const placesWithDistance = placesData.map(place => {
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
        
        // Filter by accessibility preferences if needed
        const filteredPlaces = accessibilityPreferences.requiredFeatures.length > 0
          ? placesWithDistance.filter(place => 
              accessibilityPreferences.requiredFeatures.some(requiredFeature => 
                place.accessibilityFeatures.some(
                  feature => feature.type === requiredFeature && feature.available
                )
              )
            )
          : placesWithDistance;
        
        setPlaces(filteredPlaces);
      } catch (error) {
        console.error("Error fetching nearby places:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbyPlaces();
  }, [currentLocation, activeCategory, accessibilityPreferences.requiredFeatures]);

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
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full">
                    <Skeleton className="w-full h-40 mb-2" />
                    <Skeleton className="w-3/4 h-5 mb-1" />
                    <Skeleton className="w-1/2 h-4 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="w-20 h-6" />
                      <Skeleton className="w-20 h-6" />
                    </div>
                  </div>
                ))}
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