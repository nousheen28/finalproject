import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/navigation/Header';
import { SearchBar } from '@/components/navigation/SearchBar';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { PlaceCard } from '@/components/places/PlaceCard';
import { Loader2, Filter } from 'lucide-react';
import { searchLocations, processOsmData, getNearbyAccessiblePlaces, calculateDistance } from '@/lib/api';
import type { PlaceDetails } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/lib/context';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
  const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : undefined;
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PlaceDetails[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAccessibilityFeatures, setSelectedAccessibilityFeatures] = useState<string[]>([]);
  const { currentLocation } = useAppContext();

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };

  // Filter features
  const toggleAccessibilityFeature = (feature: string) => {
    setSelectedAccessibilityFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  // Filter results based on selected accessibility features
  const filteredResults = selectedAccessibilityFeatures.length > 0
    ? results.filter(place => 
        selectedAccessibilityFeatures.every(feature => 
          place.accessibilityFeatures.some(f => f.type === feature && f.available)
        )
      )
    : results;

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      
      setIsLoading(true);
      try {
        // If lat/lon are provided, search nearby that location
        if (lat !== undefined && lon !== undefined) {
          const placesData = await getNearbyAccessiblePlaces(lat, lon, 1000);
          const processedPlaces = placesData
            .map(processOsmData)
            .filter(Boolean) as PlaceDetails[];
          
          // Calculate distance from current location if available
          if (currentLocation) {
            processedPlaces.forEach(place => {
              (place as any).distance = calculateDistance(
                currentLocation[0], currentLocation[1],
                place.coordinates[0], place.coordinates[1]
              );
            });
            
            // Sort by distance
            processedPlaces.sort((a, b) => (a as any).distance - (b as any).distance);
          }
          
          setResults(processedPlaces);
        } else {
          // Otherwise use the search API
          const searchResults = await searchLocations(query);
          
          // Convert search results to place details
          const places = searchResults.map(result => {
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            
            // Calculate distance from current location if available
            let distance;
            if (currentLocation) {
              distance = calculateDistance(
                currentLocation[0], currentLocation[1],
                lat, lon
              );
            }
            
            return {
              id: result.place_id,
              name: result.display_name.split(',')[0],
              address: result.display_name,
              coordinates: [lat, lon] as [number, number],
              placeType: result.type,
              accessibilityFeatures: [], // We don't have accessibility info from search results
              osmId: `${result.osm_type}/${result.osm_id}`,
              distance
            };
          });
          
          // Sort by distance if available
          if (currentLocation) {
            places.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
          }
          
          setResults(places);
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, lat, lon, currentLocation]);

  return (
    <main className="w-full min-h-screen bg-background text-foreground pb-16">
      <Header title="Search" />
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <SearchBar 
            onSearch={handleSearch} 
            placeholder="Search for places..." 
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-primary text-primary-foreground" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Filter panel */}
        {showFilters && (
          <Card className="p-3 mb-4">
            <h3 className="font-medium mb-2">Accessibility Features</h3>
            <div className="grid grid-cols-2 gap-2">
              {['wheelchair', 'ramp', 'elevator', 'accessible_toilet', 'braille', 'hearing_loop'].map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`feature-${feature}`} 
                    checked={selectedAccessibilityFeatures.includes(feature)}
                    onCheckedChange={() => toggleAccessibilityFeature(feature)}
                  />
                  <Label htmlFor={`feature-${feature}`} className="capitalize">{feature.replace('_', ' ')}</Label>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="space-y-4">
            {filteredResults.map((place) => (
              <PlaceCard 
                key={place.id} 
                place={place} 
                distance={(place as any).distance}
              />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No results found for "{query}"</p>
            {selectedAccessibilityFeatures.length > 0 && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSelectedAccessibilityFeatures([])}
              >
                Clear accessibility filters
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Search for places, addresses, or points of interest</p>
          </div>
        )}
      </div>
      
      <NavigationBar />
    </main>
  );
};

export default SearchPage;