import React, { useEffect, useState } from 'react';
import { ArrowRight, Volume2, VolumeX, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { speakInstruction, vibrateDevice, vibrationPatterns } from '@/lib/api';
import { useAppContext } from '@/lib/context';
import { Progress } from '@/components/ui/progress';
import type { RouteStep } from '@/lib/api';

interface NavigationStepsProps {
  steps: RouteStep[];
  totalDistance: number;
  totalDuration: number;
  onReroute?: () => void;
}

export const NavigationSteps: React.FC<NavigationStepsProps> = ({
  steps,
  totalDistance,
  totalDuration,
  onReroute
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [distanceToNextStep, setDistanceToNextStep] = useState<number | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const { accessibilityPreferences, currentLocation, isRerouting } = useAppContext();
  
  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];
  
  // Calculate progress through the route
  useEffect(() => {
    const totalSteps = steps.length;
    const progress = ((currentStepIndex + 1) / totalSteps) * 100;
    setProgressPercent(progress);
  }, [currentStepIndex, steps.length]);
  
  // Auto-advance to next step based on simulated location changes
  // In a real app, this would use actual distance calculations to the next waypoint
  useEffect(() => {
    if (!currentLocation || !accessibilityPreferences.routePreferences.audioGuidance || isRerouting) return;
    
    // Simulate progress through the route
    const simulationInterval = setInterval(() => {
      // This is a simplified simulation - in a real app, you would:
      // 1. Calculate distance to next waypoint
      // 2. Check if user has reached or passed the waypoint
      // 3. Advance to next step if needed
      
      // For demo purposes, we'll just advance every 10 seconds
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
        
        // Simulate distance decreasing
        setDistanceToNextStep(currentStep.distance);
        
        // Provide haptic feedback for step change
        vibrateDevice([100, 50, 100]);
      } else {
        clearInterval(simulationInterval);
      }
    }, 10000); // 10 seconds between steps for demo
    
    // Simulate distance updates more frequently
    const distanceUpdateInterval = setInterval(() => {
      if (distanceToNextStep !== null && distanceToNextStep > 0) {
        setDistanceToNextStep(prev => Math.max(0, (prev || 0) - 20));
      }
    }, 1000);
    
    return () => {
      clearInterval(simulationInterval);
      clearInterval(distanceUpdateInterval);
    };
  }, [currentLocation, currentStepIndex, steps.length, accessibilityPreferences.routePreferences.audioGuidance, isRerouting, currentStep]);
  
  // Speak instructions when current step changes or when audio is enabled
  useEffect(() => {
    if (audioEnabled && currentStep && accessibilityPreferences.routePreferences.audioGuidance) {
      // Announce the current step
      speakInstruction(currentStep.instruction, {
        rate: accessibilityPreferences.routePreferences.textSize === 'large' ? 0.8 : 0.9,
        pitch: 1.0,
        volume: 1.0
      });
      
      // If this is the last step, announce arrival
      if (currentStepIndex === steps.length - 1) {
        setTimeout(() => {
          speakInstruction("You have arrived at your destination.");
          vibrateDevice(vibrationPatterns.arrival);
        }, 2000);
      }
      // If there's a next step, announce it's coming up after a delay
      else if (nextStep) {
        const announcementDelay = Math.min(5000, currentStep.distance * 10); // Delay based on distance
        setTimeout(() => {
          speakInstruction(`In ${currentStep.distance} meters, ${nextStep.instruction}`);
        }, announcementDelay);
      }
    }
  }, [currentStep, currentStepIndex, audioEnabled, accessibilityPreferences.routePreferences.audioGuidance, steps.length, nextStep, accessibilityPreferences.routePreferences.textSize]);
  
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    
    // Stop any ongoing speech
    if (audioEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    } else if (!audioEnabled && currentStep) {
      // Resume guidance if turning audio back on
      speakInstruction(currentStep.instruction);
    }
  };
  
  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      vibrateDevice([100]);
      
      // Speak the next instruction if audio is enabled
      if (audioEnabled && accessibilityPreferences.routePreferences.audioGuidance) {
        speakInstruction(steps[currentStepIndex + 1].instruction);
      }
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      vibrateDevice([100]);
      
      // Speak the previous instruction if audio is enabled
      if (audioEnabled && accessibilityPreferences.routePreferences.audioGuidance) {
        speakInstruction(steps[currentStepIndex - 1].instruction);
      }
    }
  };
  
  const handleReroute = () => {
    if (onReroute) {
      onReroute();
      vibrateDevice(vibrationPatterns.warning);
      speakInstruction("Finding a new route for you.");
    }
  };
  
  // Get appropriate icon for current step maneuver
  const getManeuverIcon = (maneuver?: string) => {
    switch (maneuver) {
      case 'turn-left':
        return '↰';
      case 'turn-right':
        return '↱';
      case 'straight':
        return '↑';
      case 'elevator':
        return '🔼';
      case 'ramp':
        return '⤴️';
      case 'step-up':
        return '⬆️';
      case 'arrive':
        return '🏁';
      default:
        return '•';
    }
  };
  
  return (
    <div className="navigation-steps">
      {/* Summary bar */}
      <div className={`${accessibilityPreferences.uiPreferences.highContrast ? 'bg-black text-white' : 'bg-primary text-primary-foreground'} p-3 flex justify-between items-center rounded-t-lg`}>
        <div>
          <div className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-base' : 'text-sm'} font-medium`}>
            {Math.round(totalDistance)} m
          </div>
          <div className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-sm' : 'text-xs'}`}>
            {Math.round(totalDuration)} min
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isRerouting ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReroute}
              className={accessibilityPreferences.uiPreferences.highContrast ? "text-white bg-black border border-white" : "text-primary-foreground"}
            >
              <RotateCw className={`${accessibilityPreferences.uiPreferences.largeText ? 'h-6 w-6' : 'h-5 w-5'} animate-spin`} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className={accessibilityPreferences.uiPreferences.highContrast ? "text-white bg-black border border-white" : "text-primary-foreground"}
              aria-label={audioEnabled ? "Disable voice guidance" : "Enable voice guidance"}
            >
              {audioEnabled ? (
                <Volume2 className={accessibilityPreferences.uiPreferences.largeText ? 'h-6 w-6' : 'h-5 w-5'} />
              ) : (
                <VolumeX className={accessibilityPreferences.uiPreferences.largeText ? 'h-6 w-6' : 'h-5 w-5'} />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <Progress 
        value={progressPercent} 
        className={`h-2 ${accessibilityPreferences.uiPreferences.highContrast ? 'bg-gray-300' : 'bg-muted'}`}
      />
      
      {/* Current step */}
      <Card className={`${accessibilityPreferences.uiPreferences.highContrast ? 'border-4 border-black' : 'border-l-4 border-l-primary'} mb-4 mt-4`}>
        <CardContent className={`p-4 ${accessibilityPreferences.uiPreferences.largeText ? 'text-lg' : ''}`}>
          <div className="flex items-start">
            <div className={`${accessibilityPreferences.uiPreferences.highContrast ? 'bg-black text-white' : 'bg-primary text-primary-foreground'} rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 ${accessibilityPreferences.uiPreferences.largeText ? 'text-lg' : ''}`}>
              {getManeuverIcon(currentStep?.maneuver)}
            </div>
            <div>
              <h3 className={`font-medium ${accessibilityPreferences.uiPreferences.largeText ? 'text-lg' : ''}`}>
                {currentStep?.instruction}
              </h3>
              {currentStep?.distance > 0 && (
                <p className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-base' : 'text-sm'} ${accessibilityPreferences.uiPreferences.highContrast ? 'text-black font-medium' : 'text-muted-foreground'}`}>
                  {distanceToNextStep !== null ? distanceToNextStep : currentStep.distance} meters
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Next step preview */}
      {nextStep && (
        <Card className={`mb-4 ${accessibilityPreferences.uiPreferences.highContrast ? 'border-2 border-gray-500' : 'opacity-70'}`}>
          <CardContent className={`p-4 ${accessibilityPreferences.uiPreferences.largeText ? 'text-lg' : ''}`}>
            <div className="flex items-start">
              <div className={`${accessibilityPreferences.uiPreferences.highContrast ? 'bg-gray-700 text-white' : 'bg-muted text-muted-foreground'} rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0`}>
                <ArrowRight className={`${accessibilityPreferences.uiPreferences.largeText ? 'h-5 w-5' : 'h-4 w-4'}`} />
              </div>
              <div>
                <h3 className={`font-medium ${accessibilityPreferences.uiPreferences.largeText ? 'text-lg' : ''}`}>
                  Next: {nextStep.instruction}
                </h3>
                {nextStep.distance > 0 && (
                  <p className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-base' : 'text-sm'} ${accessibilityPreferences.uiPreferences.highContrast ? 'text-gray-700 font-medium' : 'text-muted-foreground'}`}>
                    {nextStep.distance} meters
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Navigation controls */}
      <div className="flex justify-between mt-4">
        <Button
          variant={accessibilityPreferences.uiPreferences.highContrast ? "default" : "outline"}
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
          className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-lg py-6' : ''} ${accessibilityPreferences.uiPreferences.highContrast ? 'bg-black text-white border-2 border-white' : ''}`}
        >
          Previous
        </Button>
        <Button
          onClick={goToNextStep}
          disabled={currentStepIndex === steps.length - 1}
          className={`${accessibilityPreferences.uiPreferences.largeText ? 'text-lg py-6' : ''} ${accessibilityPreferences.uiPreferences.highContrast ? 'bg-black text-white border-2 border-white' : ''}`}
        >
          Next
        </Button>
      </div>
    </div>
  );
};