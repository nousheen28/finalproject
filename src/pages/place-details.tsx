import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/navigation/Header';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { Button } from '@/components/ui/button';
import { AccessibilityFeaturesList } from '@/components/places/AccessibilityFeatures';
import { MapPin, Phone, Globe, ThumbsUp, ThumbsDown, AlertTriangle, Share2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import { useToast } from '@/hooks/use-toast';
import { getPlaceDetailsByOsmId } from '@/lib/api';
import type { PlaceDetails } from '@/lib/api';
import { MapView } from '@/components/map/MapView';
import { Skeleton } from '@/components/ui/skeleton';

const PlaceDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { setDestination, startNavigation, addSavedPlace, savedPlaces } = useAppContext();
  const [place, setPlace] = useState<PlaceDetails | null>(location.state?.place || null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch place details if not provided in location state
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      if (!place && id) {
        setIsLoading(true);
        try {
          // Try to fetch by OSM ID first
          const placeDetails = await getPlaceDetailsByOsmId(id);
          if (placeDetails) {
            setPlace(placeDetails);
          } else {
            toast({
              title: "Error",
              description: "Could not find place details",
              variant: "destructive"
            });
            navigate('/');
          }
        } catch (error) {
          console.error("Error fetching place details:", error);
          toast({
            title: "Error",
            description: "Failed to load place details",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPlaceDetails();
  }, [id, place, navigate, toast]);

  if (isLoading) {
    return (
      <main className="w-full min-h-screen bg-background text-foreground pb-16">
        <Header title="Details" />
        <div className="p-4">
          <Skeleton className="w-full h-64 mb-4" />
          <Skeleton className="w-3/4 h-8 mb-2" />
          <Skeleton className="w-1/2 h-4 mb-4" />
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-3/4 h-4 mb-4" />
          <Skeleton className="w-full h-48 mb-4" />
          <Skeleton className="w-full h-24 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-10" />
            <Skeleton className="flex-1 h-10" />
          </div>
        </div>
        <NavigationBar />
      </main>
    );
  }

  if (!place) {
    // Redirect to home if no place data
    navigate('/');
    return null;
  }

  const handleNavigate = () => {
    setDestination(place.coordinates);
    startNavigation();
    navigate('/navigation');
  };

  const handleSavePlace = () => {
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
      description: `${place.name} has been added to your saved places.`
    });
  };

  const handleReportProblem = () => {
    navigate('/report-problem', { state: { place } });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `Check out ${place.name} on AccessNow`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Place link copied to clipboard"
      });
    }
  };
  
  const nextPhoto = () => {
    if (place.photos && place.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % place.photos!.length);
    }
  };
  
  const prevPhoto = () => {
    if (place.photos && place.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + place.photos!.length) % place.photos!.length);
    }
  };

  // Determine accessibility status
  const accessibleFeatures = place.accessibilityFeatures.filter(f => f.available).length;
  let accessibilityStatus = 'Unknown';
  let statusColor = 'bg-gray-500';
  
  if (accessibleFeatures >= 3) {
    accessibilityStatus = 'Accessible';
    statusColor = 'bg-green-500';
  } else if (accessibleFeatures >= 1) {
    accessibilityStatus = 'Partially Accessible';
    statusColor = 'bg-yellow-500';
  } else {
    accessibilityStatus = 'Not Verified';
    statusColor = 'bg-gray-500';
  }
  
  // Check if place is saved
  const isSaved = savedPlaces.some(p => 
    p.id === place.id || 
    (p.latitude === place.coordinates[0] && p.longitude === place.coordinates[1])
  );

  return (
    <main className="w-full min-h-screen bg-background text-foreground pb-16">
      <Header title="Details" showShareButton onShare={handleShare} />
      
      {/* Photo gallery */}
      {place.photos && place.photos.length > 0 && (
        <div className="relative w-full h-64">
          <img 
            src={place.photos[currentPhotoIndex]} 
            alt={`${place.name} - Photo ${currentPhotoIndex + 1}`}
            className="w-full h-full object-cover"
          />
          
          {place.photos.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 rounded-full"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 rounded-full"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-background/80 px-2 py-1 rounded-full text-xs">
                {currentPhotoIndex + 1} / {place.photos.length}
              </div>
            </>
          )}
          
          {/* Rating badge */}
          {place.rating && (
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-medium">{place.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        {/* Place header */}
        <div className="flex items-center mb-6">
          <div className={`w-12 h-12 rounded-full ${statusColor} flex items-center justify-center text-white mr-4`}>
            <ThumbsUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{place.name}</h1>
            <div className="flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full ${statusColor} mr-2`}></span>
              <span className="text-sm">{accessibilityStatus}</span>
            </div>
          </div>
        </div>
        
        {/* Place details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-3 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm">{place.address}</p>
          </div>
          
          {place.phone && (
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
              <p className="text-sm">{place.phone}</p>
            </div>
          )}
          
          {place.website && (
            <div className="flex items-center">
              <Globe className="h-5 w-5 mr-3 text-muted-foreground" />
              <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                {place.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </div>
          )}
        </div>
        
        {/* Map view */}
        <div className="mb-6 h-48 rounded-lg overflow-hidden border border-border">
          <MapView 
            height="h-full" 
            showNearbyPlaces={false}
          />
        </div>
        
        {/* Accessibility features */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Accessibility Features</h2>
          <AccessibilityFeaturesList features={place.accessibilityFeatures} showUnavailable={true} />
        </div>
        
        {/* Action buttons */}
        <div className="space-y-3">
          <Button className="w-full" onClick={handleNavigate}>
            <MapPin className="h-4 w-4 mr-2" />
            Show Directions
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleSavePlace}
            disabled={isSaved}
          >
            {isSaved ? "Saved to Your Places" : "Add to Saved Places"}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground" 
            onClick={handleReportProblem}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report A Problem
          </Button>
        </div>
      </div>
      
      <NavigationBar />
    </main>
  );
};

export default PlaceDetailsPage;