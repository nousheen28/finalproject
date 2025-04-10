import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/navigation/Header';
import { SearchBar } from '@/components/navigation/SearchBar';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { PlaceCard } from '@/components/places/PlaceCard';
import { Loader2 } from 'lucide-react';
import { searchLocations, processOsmData } from '@/lib/api';
import type { PlaceDetails } from '@/lib/api';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PlaceDetails[]>([]);

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      
      setIsLoading(true);
      try {
        const searchResults = await searchLocations(query);
        
        // Convert search results to place details
        const places = searchResults.map(result => ({
          id: result.place_id,
          name: result.display_name.split(',')[0],
          address: result.display_name,
          coordinates: [parseFloat(result.lat), parseFloat(result.lon)] as [number, number],
          placeType: result.type,
          accessibilityFeatures: [], // We don't have accessibility info from search results
          osmId: `${result.osm_type}/${result.osm_id}`
        }));
        
        setResults(places);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <main className="w-full min-h-screen bg-background text-foreground pb-16">
      <Header title="Search" />
      
      <div className="p-4">
        <SearchBar 
          onSearch={handleSearch} 
          placeholder="Search for places..." 
          className="mb-4"
        />
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No results found for "{query}"</p>
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