import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/navigation/Header';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { Button } from '@/components/ui/button';
import { AccessibilityFeaturesList } from '@/components/places/AccessibilityFeatures';
import { MapPin, Phone, Globe, ThumbsUp, ThumbsDown, AlertTriangle, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import { useToast } from '@/hooks/use-toast';
import type { PlaceDetails } from '@/lib/api';
import { MapView } from '@/components/map/MapView';

const PlaceDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setDestination, startNavigation, addSavedPlace, savedPlaces } = useAppContext();
  const [place, setPlace] = useState<PlaceDetails>(location.state?.place);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
          
          {/* These would be populated with real data in a full implementation */}
          <div className="flex items-center">
            <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
            <p className="text-sm">+1 (555) 123-4567</p>
          </div>
          
          <div className="flex items-center">
            <Globe className="h-5 w-5 mr-3 text-muted-foreground" />
            <a href="#" className="text-sm text-primary underline">www.example.com</a>
          </div>
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