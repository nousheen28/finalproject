import React, { useState, useEffect } from 'react';
import { Header } from '@/components/navigation/Header';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { MapView } from '@/components/map/MapView';
import { NavigationSteps } from '@/components/routes/NavigationSteps';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X, RotateCw } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import { reverseGeocode, speakInstruction, vibrateDevice, vibrationPatterns } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const NavigationPage = () => {
  const { 
    currentLocation, 
    destination, 
    isNavigating, 
    stopNavigation, 
    accessibilityPreferences,
    selectedRoute,
    setSelectedRoute,
    transportMode,
    isRerouting,
    stopRerouting,
    findRoutes
  } = useAppContext();
  const [showSteps, setShowSteps] = useState(true);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize navigation with voice announcement
  useEffect(() => {
    if (isNavigating && currentLocation && destination && accessibilityPreferences.routePreferences.audioGuidance) {
      speakInstruction("Navigation started. Follow the directions to reach your destination safely.");
      
      // Provide haptic feedback
      vibrateDevice([200, 100, 200]);
    }
    
    return () => {
      // Clean up speech when component unmounts
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // Get route when navigation starts or when rerouting
    if ((isNavigating && currentLocation && destination && !selectedRoute) || isRerouting) {
      const getRoute = async () => {
        try {
          // Get routes using A* algorithm with accessibility preferences
          await findRoutes(currentLocation!, destination!);
          
          // If rerouting, stop rerouting state
          if (isRerouting) {
            stopRerouting();
            
            // Announce rerouting complete
            if (accessibilityPreferences.routePreferences.audioGuidance) {
              speakInstruction("New route found. Continuing navigation.");
              vibrateDevice([100, 100, 100]);
            }
          } else {
            // Announce route if audio guidance is enabled (first time only)
            if (accessibilityPreferences.routePreferences.audioGuidance && selectedRoute) {
              const distanceKm = (selectedRoute.distance / 1000).toFixed(1);
              const minutes = Math.round(selectedRoute.duration);
              speakInstruction(
                `Route found. ${distanceKm} kilometers, approximately ${minutes} minutes. ` +
                `First direction: ${selectedRoute.steps[0].instruction}`
              );
            }
          }
        } catch (error) {
          console.error("Error finding route:", error);
          toast({
            title: "Error finding route",
            description: "Could not find a suitable route. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      getRoute();
    }
  }, [isNavigating, currentLocation, destination, accessibilityPreferences, transportMode, isRerouting, findRoutes, selectedRoute, stopRerouting]);

  useEffect(() => {
    // Get addresses for start and end points
    const getAddresses = async () => {
      if (!currentLocation || !destination) return;
      
      setIsLoadingAddresses(true);
      try {
        const [startData, endData] = await Promise.all([
          reverseGeocode(currentLocation[0], currentLocation[1]),
          reverseGeocode(destination[0], destination[1])
        ]);
        
        if (startData) {
          setStartAddress(startData.display_name);
        }
        
        if (endData) {
          setEndAddress(endData.display_name);
        }
      } catch (error) {
        console.error("Error getting addresses:", error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    
    getAddresses();
  }, [currentLocation, destination]);

  const handleStopNavigation = () => {
    // Announce navigation ending if audio guidance is enabled
    if (accessibilityPreferences.routePreferences.audioGuidance) {
      speakInstruction("Navigation stopped.");
    }
    
    stopNavigation();
    toast({
      title: "Navigation ended",
      description: "You've stopped the current navigation."
    });
    navigate('/');
  };
  
  const handleReroute = () => {
    if (!isRerouting) {
      // Trigger rerouting
      setSelectedRoute(null);
      stopRerouting();
      
      toast({
        title: "Rerouting",
        description: "Finding a new route for you..."
      });
    }
  };

  if (!isNavigating || !currentLocation || !destination || !selectedRoute) {
    return (
      <main className="w-full min-h-screen bg-background text-foreground pb-16 flex items-center justify-center">
        <div className="text-center p-4">
          <p className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-xl' : 'text-lg'} mb-4`}>
            {isRerouting ? "Finding a new route..." : "No active navigation"}
          </p>
          {isRerouting ? (
            <div className="flex justify-center">
              <RotateCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Button 
              onClick={() => window.history.back()}
              className={accessibilityPreferences.uiPreferences.highContrast ? "bg-black text-white border-2 border-white" : ""}
            >
              Go Back
            </Button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-background text-foreground pb-16">
      <Header 
        title="Navigation" 
        showBackButton={false}
      />
      
      {/* Map view */}
      <div className={showSteps ? 'h-[40vh]' : 'h-[calc(100vh-8rem)]'}>
        <MapView height="h-full" />
      </div>
      
      {/* Navigation steps panel */}
      <div className={`fixed bottom-16 left-0 right-0 bg-background border-t ${accessibilityPreferences.uiPreferences.highContrast ? 'border-black border-t-2' : 'border-border'} transition-transform duration-300 ${
        showSteps ? 'translate-y-0' : 'translate-y-[calc(100%-2.5rem)]'
      }`}>
        {/* Panel handle */}
        <div 
          className={`h-10 flex items-center justify-center cursor-pointer ${accessibilityPreferences.uiPreferences.highContrast ? 'border-b-2 border-black bg-gray-100' : 'border-b border-border'}`}
          onClick={() => setShowSteps(!showSteps)}
        >
          <div className="flex items-center">
            {showSteps ? (
              <>
                <ChevronDown className={`${accessibilityPreferences.uiPreferences.largeText ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                <span className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-base' : 'text-sm'}`}>Hide Steps</span>
              </>
            ) : (
              <>
                <ChevronUp className={`${accessibilityPreferences.uiPreferences.largeText ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                <span className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-base' : 'text-sm'}`}>Show Steps</span>
              </>
            )}
          </div>
        </div>
        
        {/* Addresses */}
        <div className={`p-4 ${accessibilityPreferences.uiPreferences.highContrast ? 'border-b-2 border-black' : 'border-b border-border'}`}>
          {isLoadingAddresses ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full ${accessibilityPreferences.uiPreferences.highContrast ? 'bg-black' : 'bg-green-500'} mr-2`}></div>
                <p className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-base' : 'text-sm'} truncate`}>
                  {startAddress || 'Current Location'}
                </p>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${accessibilityPreferences.uiPreferences.highContrast ? 'bg-black' : 'bg-red-500'} mr-2`}></div>
                <p className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-base' : 'text-sm'} truncate`}>
                  {endAddress || 'Destination'}
                </p>
              </div>
            </>
          )}
        </div>
        
        {/* Navigation steps */}
        <div className={`p-4 max-h-[50vh] overflow-y-auto ${accessibilityPreferences.uiPreferences.largeText ? 'space-y-6' : ''}`}>
          <NavigationSteps 
            steps={selectedRoute.steps} 
            totalDistance={selectedRoute.distance} 
            totalDuration={selectedRoute.duration}
            onReroute={handleReroute}
          />
        </div>
      </div>
      
      {/* Stop navigation button */}
      <Button 
        variant={accessibilityPreferences.uiPreferences.highContrast ? "default" : "destructive"}
        size="icon"
        className={`fixed top-20 right-4 rounded-full ${accessibilityPreferences.uiPreferences.largeText ? 'h-12 w-12' : 'h-10 w-10'} shadow-lg z-40 ${accessibilityPreferences.uiPreferences.highContrast ? 'bg-black text-white border-2 border-white' : ''}`}
        onClick={handleStopNavigation}
      >
        <X className={accessibilityPreferences.uiPreferences.largeText ? 'h-6 w-6' : 'h-5 w-5'} />
      </Button>
      
      <NavigationBar />
    </main>
  );
};

export default NavigationPage;