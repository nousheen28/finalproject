import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccessibilityFeatureBadge } from './AccessibilityFeatures';
import { Bookmark, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/lib/context';
import type { PlaceDetails } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface PlaceCardProps {
  place: PlaceDetails;
  distance?: number;
  showActions?: boolean;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  distance,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const { savedPlaces, addSavedPlace, setDestination, startNavigation } = useAppContext();
  const { toast } = useToast();
  
  const isSaved = savedPlaces.some(p => 
    p.id === place.id || 
    (p.latitude === place.coordinates[0] && p.longitude === place.coordinates[1])
  );

  const handleSavePlace = () => {
    if (isSaved) {
      toast({
        title: "Already saved",
        description: "This place is already in your saved places"
      });
      return;
    }
    
    addSavedPlace({
      name: place.name,
      address: place.address,
      latitude: place.coordinates[0],
      longitude: place.coordinates[1],
      placeType: place.placeType,
      accessibilityFeatures: JSON.stringify(place.accessibilityFeatures),
      osmId: place.osmId,
      photos: place.photos ? JSON.stringify(place.photos) : undefined
    });
    
    toast({
      title: "Place saved",
      description: `${place.name} has been added to your saved places`
    });
  };

  const handleViewDetails = () => {
    navigate(`/place-details/${place.id}`, { state: { place } });
  };

  const handleNavigate = () => {
    setDestination(place.coordinates);
    startNavigation();
    navigate('/navigation');
  };

  // Get the top 3 accessibility features to display
  const topFeatures = place.accessibilityFeatures
    .filter(feature => feature.available)
    .slice(0, 3);
    
  // Check if place has photos
  const hasPhotos = place.photos && place.photos.length > 0;

  return (
    <Card className="mb-4 overflow-hidden">
      {hasPhotos && (
        <div className="w-full h-40 relative">
          <img 
            src={place.photos![0]} 
            alt={place.name} 
            className="w-full h-full object-cover"
          />
          {place.accessibilityFeatures.some(f => f.type === 'wheelchair' && f.available) && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500 text-white">
                ♿ Wheelchair Accessible
              </Badge>
            </div>
          )}
          {place.rating && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md flex items-center">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
      <CardContent className={hasPhotos ? "p-3" : "p-4"}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{place.name}</h3>
            <p className="text-sm text-muted-foreground">{place.address}</p>
            
            {distance !== undefined && (
              <p className="text-sm mt-1">
                <span className="font-medium">{(distance / 1000).toFixed(1)} km</span> from you
              </p>
            )}
          </div>
          
          {showActions && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSavePlace}
              className={isSaved ? "text-primary" : "text-muted-foreground"}
            >
              <Bookmark className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {topFeatures.map((feature, index) => (
            <AccessibilityFeatureBadge key={index} featureType={feature.type as any} />
          ))}
          
          {place.accessibilityFeatures.filter(f => f.available).length > 3 && (
            <Badge variant="outline">
              +{place.accessibilityFeatures.filter(f => f.available).length - 3} more
            </Badge>
          )}
        </div>
        
        {showActions && (
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleViewDetails}>
              Details
            </Button>
            <Button size="sm" className="flex-1" onClick={handleNavigate}>
              <MapPin className="h-4 w-4 mr-1" />
              Navigate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};