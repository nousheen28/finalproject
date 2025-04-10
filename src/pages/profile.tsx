import React, { useState, useEffect } from 'react';
import { Header } from '@/components/navigation/Header';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlaceCard } from '@/components/places/PlaceCard';
import { User, Settings, Bookmark, History, LogOut, Volume2, Eye, Contrast, TextQuote, ZoomIn } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import { fine } from '@/lib/fine';
import { useNavigate } from 'react-router-dom';
import { AccessibilityFeatureType, DisabilityType, TransportMode, transportModeLabels, MobilityAidType } from '@/lib/accessibility-types';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { speakInstruction } from '@/lib/api';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const ProfilePage = () => {
  const { 
    accessibilityPreferences, 
    updateAccessibilityPreferences,
    savedPlaces,
    transportMode,
    setTransportMode,
    removeSavedPlace
  } = useAppContext();
  const { data: session } = fine.auth.useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Voice settings
  const [voiceRate, setVoiceRate] = useState(0.9);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceVolume, setVoiceVolume] = useState(1.0);

  const disabilityTypes: { value: DisabilityType; label: string }[] = [
    { value: 'wheelchair', label: 'Wheelchair User' },
    { value: 'visual', label: 'Visual Impairment' },
    { value: 'hearing', label: 'Hearing Impairment' },
    { value: 'cognitive', label: 'Cognitive Disability' },
    { value: 'mobility', label: 'Mobility Impairment' },
    { value: 'none', label: 'No Disability' }
  ];

  const accessibilityFeatures: { value: AccessibilityFeatureType; label: string }[] = [
    { value: 'wheelchair', label: 'Wheelchair Access' },
    { value: 'ramp', label: 'Ramps' },
    { value: 'elevator', label: 'Elevators' },
    { value: 'accessible_toilet', label: 'Accessible Toilets' },
    { value: 'braille', label: 'Braille Signage' },
    { value: 'hearing_loop', label: 'Hearing Loop' },
    { value: 'sign_language', label: 'Sign Language' },
    { value: 'quiet_space', label: 'Quiet Space' },
    { value: 'smooth_terrain', label: 'Smooth Terrain' },
    { value: 'no_stairs', label: 'No Stairs' }
  ];
  
  const transportModes: { value: TransportMode; label: string }[] = [
    { value: 'walking', label: 'Walking' },
    { value: 'wheelchair', label: 'Wheelchair' },
    { value: 'cane', label: 'Using Cane' },
    { value: 'walker', label: 'Using Walker' }
  ];

  const handleDisabilityChange = (type: DisabilityType, checked: boolean) => {
    const updatedTypes = checked
      ? [...accessibilityPreferences.disabilityTypes, type]
      : accessibilityPreferences.disabilityTypes.filter(t => t !== type);
    
    updateAccessibilityPreferences({
      disabilityTypes: updatedTypes
    });
    
    // Auto-select relevant features based on disability type
    if (checked) {
      let newFeatures = [...accessibilityPreferences.requiredFeatures];
      
      switch(type) {
        case 'wheelchair':
          if (!newFeatures.includes('wheelchair')) newFeatures.push('wheelchair');
          if (!newFeatures.includes('ramp')) newFeatures.push('ramp');
          if (!newFeatures.includes('elevator')) newFeatures.push('elevator');
          if (!newFeatures.includes('accessible_toilet')) newFeatures.push('accessible_toilet');
          if (!newFeatures.includes('smooth_terrain')) newFeatures.push('smooth_terrain');
          if (!newFeatures.includes('no_stairs')) newFeatures.push('no_stairs');
          // Set transport mode to wheelchair
          setTransportMode('wheelchair');
          break;
        case 'visual':
          if (!newFeatures.includes('braille')) newFeatures.push('braille');
          if (!newFeatures.includes('tactile_paving')) newFeatures.push('tactile_paving');
          // Enable audio guidance automatically for visual impairment
          updateAccessibilityPreferences({
            routePreferences: {
              ...accessibilityPreferences.routePreferences,
              audioGuidance: true
            },
            uiPreferences: {
              ...accessibilityPreferences.uiPreferences,
              highContrast: true,
              largeText: true
            }
          });
          break;
        case 'hearing':
          if (!newFeatures.includes('hearing_loop')) newFeatures.push('hearing_loop');
          if (!newFeatures.includes('sign_language')) newFeatures.push('sign_language');
          break;
        case 'mobility':
          if (!newFeatures.includes('ramp')) newFeatures.push('ramp');
          if (!newFeatures.includes('handrails')) newFeatures.push('handrails');
          if (!newFeatures.includes('elevator')) newFeatures.push('elevator');
          if (!newFeatures.includes('smooth_terrain')) newFeatures.push('smooth_terrain');
          // Set transport mode based on mobility aid
          if (accessibilityPreferences.mobilityAid === 'cane') {
            setTransportMode('cane');
          } else if (accessibilityPreferences.mobilityAid === 'walker') {
            setTransportMode('walker');
          }
          break;
        case 'cognitive':
          if (!newFeatures.includes('quiet_space')) newFeatures.push('quiet_space');
          if (!newFeatures.includes('large_print')) newFeatures.push('large_print');
          // Enable simpler UI
          updateAccessibilityPreferences({
            uiPreferences: {
              ...accessibilityPreferences.uiPreferences,
              largeText: true,
              reduceMotion: true
            }
          });
          break;
      }
      
      updateAccessibilityPreferences({
        requiredFeatures: newFeatures
      });
    }
  };

  const handleFeatureChange = (feature: AccessibilityFeatureType, checked: boolean) => {
    const updatedFeatures = checked
      ? [...accessibilityPreferences.requiredFeatures, feature]
      : accessibilityPreferences.requiredFeatures.filter(f => f !== feature);
    
    updateAccessibilityPreferences({
      requiredFeatures: updatedFeatures
    });
  };

  const handleAudioGuidanceChange = (checked: boolean) => {
    updateAccessibilityPreferences({
      routePreferences: {
        ...accessibilityPreferences.routePreferences,
        audioGuidance: checked
      }
    });
    
    // Provide audio feedback when enabling audio guidance
    if (checked) {
      speakInstruction("Audio guidance is now enabled.");
    }
  };

  const handleAvoidStairsChange = (checked: boolean) => {
    updateAccessibilityPreferences({
      routePreferences: {
        ...accessibilityPreferences.routePreferences,
        avoidStairs: checked
      }
    });
  };
  
  const handleVoiceRateChange = (value: number[]) => {
    setVoiceRate(value[0]);
    // Test the new voice rate
    speakInstruction("This is how the voice guidance will sound.", {
      rate: value[0],
      pitch: voicePitch,
      volume: voiceVolume
    });
  };
  
  const handleVoicePitchChange = (value: number[]) => {
    setVoicePitch(value[0]);
    // Test the new voice pitch
    speakInstruction("This is how the voice guidance will sound.", {
      rate: voiceRate,
      pitch: value[0],
      volume: voiceVolume
    });
  };
  
  const handleVoiceVolumeChange = (value: number[]) => {
    setVoiceVolume(value[0]);
    // Test the new voice volume
    speakInstruction("This is how the voice guidance will sound.", {
      rate: voiceRate,
      pitch: voicePitch,
      volume: value[0]
    });
  };
  
  const handleHighContrastChange = (checked: boolean) => {
    updateAccessibilityPreferences({
      uiPreferences: {
        ...accessibilityPreferences.uiPreferences,
        highContrast: checked
      }
    });
  };
  
  const handleLargeTextChange = (checked: boolean) => {
    updateAccessibilityPreferences({
      uiPreferences: {
        ...accessibilityPreferences.uiPreferences,
        largeText: checked
      }
    });
  };
  
  const handleReduceMotionChange = (checked: boolean) => {
    updateAccessibilityPreferences({
      uiPreferences: {
        ...accessibilityPreferences.uiPreferences,
        reduceMotion: checked
      }
    });
  };
  
  const handleAlwaysShowLabelsChange = (checked: boolean) => {
    updateAccessibilityPreferences({
      uiPreferences: {
        ...accessibilityPreferences.uiPreferences,
        alwaysShowLabels: checked
      }
    });
  };
  
  const handleTransportModeChange = (value: TransportMode) => {
    setTransportMode(value);
    
    // Update mobility aid preference
    let mobilityAid: MobilityAidType = 'none';
    
    switch (value) {
      case 'wheelchair':
        mobilityAid = 'manual_wheelchair';
        break;
      case 'cane':
        mobilityAid = 'cane';
        break;
      case 'walker':
        mobilityAid = 'walker';
        break;
      default:
        mobilityAid = 'none';
    }
    
    updateAccessibilityPreferences({
      mobilityAid
    });
  };
  
  const handleRoutePreferenceChange = (preference: string, checked: boolean) => {
    const updatedPreferences = { ...accessibilityPreferences.routePreferences };
    
    switch (preference) {
      case 'preferShortestRoute':
        updatedPreferences.preferShortestRoute = checked;
        if (checked) {
          updatedPreferences.preferFewestObstacles = false;
          updatedPreferences.preferSmoothTerrain = false;
        }
        break;
      case 'preferFewestObstacles':
        updatedPreferences.preferFewestObstacles = checked;
        if (checked) {
          updatedPreferences.preferShortestRoute = false;
          updatedPreferences.preferSmoothTerrain = false;
        }
        break;
      case 'preferSmoothTerrain':
        updatedPreferences.preferSmoothTerrain = checked;
        if (checked) {
          updatedPreferences.preferShortestRoute = false;
          updatedPreferences.preferFewestObstacles = false;
        }
        break;
    }
    
    updateAccessibilityPreferences({
      routePreferences: updatedPreferences
    });
  };

  const handleLogout = async () => {
    await fine.auth.signOut();
    navigate('/');
  };
  
  const handleSaveVoiceSettings = () => {
    // In a real app, you would save these settings to the user's profile
    toast({
      title: "Voice settings saved",
      description: "Your voice guidance preferences have been updated."
    });
    
    // Test the final voice settings
    speakInstruction("Your voice settings have been saved.", {
      rate: voiceRate,
      pitch: voicePitch,
      volume: voiceVolume
    });
  };
  
  const handleRemoveSavedPlace = async (placeId: number) => {
    try {
      await removeSavedPlace(placeId);
      toast({
        title: "Place removed",
        description: "The place has been removed from your saved places."
      });
    } catch (error) {
      console.error("Error removing saved place:", error);
      toast({
        title: "Error",
        description: "Failed to remove place. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Determine if we should use large text based on preferences
  const largeText = accessibilityPreferences.uiPreferences.largeText;
  const highContrast = accessibilityPreferences.uiPreferences.highContrast;

  return (
    <main className="w-full min-h-screen bg-background text-foreground pb-16">
      <Header title="Profile" />
      
      <div className="p-4">
        {/* User info */}
        <div className="flex items-center mb-6">
          <div className={`w-16 h-16 rounded-full ${highContrast ? 'bg-black text-white' : 'bg-primary text-primary-foreground'} flex items-center justify-center mr-4`}>
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className={`${largeText ? 'text-2xl' : 'text-xl'} font-bold`}>{session?.user?.name || 'Guest User'}</h1>
            <p className={`${largeText ? 'text-base' : 'text-sm'} text-muted-foreground`}>{session?.user?.email || 'Sign in to save your preferences'}</p>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="preferences">
          <TabsList className={`w-full mb-4 ${largeText ? 'h-14' : ''}`}>
            <TabsTrigger value="preferences" className={`flex-1 ${largeText ? 'text-base py-3' : ''}`}>
              <Settings className={`${largeText ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`} />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="ui" className={`flex-1 ${largeText ? 'text-base py-3' : ''}`}>
              <Eye className={`${largeText ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`} />
              Display
            </TabsTrigger>
            <TabsTrigger value="voice" className={`flex-1 ${largeText ? 'text-base py-3' : ''}`}>
              <Volume2 className={`${largeText ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`} />
              Voice
            </TabsTrigger>
            <TabsTrigger value="saved" className={`flex-1 ${largeText ? 'text-base py-3' : ''}`}>
              <Bookmark className={`${largeText ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`} />
              Saved
            </TabsTrigger>
          </TabsList>
          
          {/* Preferences tab */}
          <TabsContent value="preferences">
            <Card className={highContrast ? 'border-2 border-black' : ''}>
              <CardContent className="p-4">
                <h2 className={`${largeText ? 'text-xl' : 'text-lg'} font-semibold mb-4`}>Accessibility Preferences</h2>
                
                <div className="space-y-6">
                  {/* Disability types */}
                  <div>
                    <h3 className={`${largeText ? 'text-base' : 'text-sm'} font-medium mb-3`}>Disability Types</h3>
                    <div className="space-y-3">
                      {disabilityTypes.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`disability-${type.value}`}
                            checked={accessibilityPreferences.disabilityTypes.includes(type.value)}
                            onCheckedChange={(checked) => 
                              handleDisabilityChange(type.value, checked as boolean)
                            }
                            className={highContrast ? 'border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white' : ''}
                          />
                          <Label 
                            htmlFor={`disability-${type.value}`}
                            className={largeText ? 'text-base' : ''}
                          >
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Transport mode */}
                  <div>
                    <h3 className={`${largeText ? 'text-base' : 'text-sm'} font-medium mb-3`}>Transport Mode</h3>
                    <RadioGroup 
                      value={transportMode} 
                      onValueChange={(value) => handleTransportModeChange(value as TransportMode)}
                      className="space-y-3"
                    >
                      {transportModes.map((mode) => (
                        <div key={mode.value} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={mode.value} 
                            id={`transport-${mode.value}`}
                            className={highContrast ? 'border-2 border-black text-black' : ''}
                          />
                          <Label 
                            htmlFor={`transport-${mode.value}`}
                            className={largeText ? 'text-base' : ''}
                          >
                            {mode.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  {/* Required features */}
                  <div>
                    <h3 className={`${largeText ? 'text-base' : 'text-sm'} font-medium mb-3`}>Required Accessibility Features</h3>
                    <div className="space-y-3">
                      {accessibilityFeatures.map((feature) => (
                        <div key={feature.value} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`feature-${feature.value}`}
                            checked={accessibilityPreferences.requiredFeatures.includes(feature.value)}
                            onCheckedChange={(checked) => 
                              handleFeatureChange(feature.value, checked as boolean)
                            }
                            className={highContrast ? 'border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white' : ''}
                          />
                          <Label 
                            htmlFor={`feature-${feature.value}`}
                            className={largeText ? 'text-base' : ''}
                          >
                            {feature.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Route preferences */}
                  <div>
                    <h3 className={`${largeText ? 'text-base' : 'text-sm'} font-medium mb-3`}>Route Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor="avoid-stairs"
                          className={largeText ? 'text-base' : ''}
                        >
                          Avoid Stairs
                        </Label>
                        <Switch 
                          id="avoid-stairs"
                          checked={accessibilityPreferences.routePreferences.avoidStairs}
                          onCheckedChange={handleAvoidStairsChange}
                          className={highContrast ? 'data-[state=checked]:bg-black' : ''}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor="shortest-route"
                          className={largeText ? 'text-base' : ''}
                        >
                          Prefer Shortest Route
                        </Label>
                        <Switch 
                          id="shortest-route"
                          checked={accessibilityPreferences.routePreferences.preferShortestRoute}
                          onCheckedChange={(checked) => handleRoutePreferenceChange('preferShortestRoute', checked)}
                          className={highContrast ? 'data-[state=checked]:bg-black' : ''}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor="fewest-obstacles"
                          className={largeText ? 'text-base' : ''}
                        >
                          Prefer Fewest Obstacles
                        </Label>
                        <Switch 
                          id="fewest-obstacles"
                          checked={accessibilityPreferences.routePreferences.preferFewestObstacles}
                          onCheckedChange={(checked) => handleRoutePreferenceChange('preferFewestObstacles', checked)}
                          className={highContrast ? 'data-[state=checked]:bg-black' : ''}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor="smooth-terrain"
                          className={largeText ? 'text-base' : ''}
                        >
                          Prefer Smooth Terrain
                        </Label>
                        <Switch 
                          id="smooth-terrain"
                          checked={accessibilityPreferences.routePreferences.preferSmoothTerrain}
                          onCheckedChange={(checked) => handleRoutePreferenceChange('preferSmoothTerrain', checked)}
                          className={highContrast ? 'data-[state=checked]:bg-black' : ''}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Logout button */}
            {session?.user && (
              <Button 
                variant={highContrast ? "default" : "outline"} 
                className={`w-full mt-4 ${highContrast ? 'bg-black text-white border-2 border-white' : 'text-destructive'} ${largeText ? 'text-lg py-6' : ''}`}
                onClick={handleLogout}
              >
                <LogOut className={`${largeText ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`} />
                Log Out
              </Button>
            )}
          </TabsContent>
          
          {/* UI Preferences tab */}
          <TabsContent value="ui">
            <Card className={highContrast ? 'border-2 border-black' : ''}>
              <CardContent className="p-4">
                <h2 className={`${largeText ? 'text-xl' : 'text-lg'} font-semibold mb-4`}>Display Settings</h2>
                
                <div className="space-y-6">
                  {/* High Contrast Mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Contrast className={`${largeText ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground`} />
                      <Label 
                        htmlFor="high-contrast"
                        className={largeText ? 'text-base' : ''}
                      >
                        High Contrast Mode
                      </Label>
                    </div>
                    <Switch 
                      id="high-contrast"
                      checked={accessibilityPreferences.uiPreferences.highContrast}
                      onCheckedChange={handleHighContrastChange}
                      className={highContrast ? 'data-[state=checked]:bg-black' : ''}
                    />
                  </div>
                  
                  {/* Large Text */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TextQuote className={`${largeText ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground`} />
                      <Label 
                        htmlFor="large-text"
                        className={largeText ? 'text-base' : ''}
                      >
                        Large Text
                      </Label>
                    </div>
                    <Switch 
                      id="large-text"
                      checked={accessibilityPreferences.uiPreferences.largeText}
                      onCheckedChange={handleLargeTextChange}
                      className={highContrast ? 'data-[state=checked]:bg-black' : ''}
                    />
                  </div>
                  
                  {/* Reduce Motion */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ZoomIn className={`${largeText ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground`} />
                      <Label 
                        htmlFor="reduce-motion"
                        className={largeText ? 'text-base' : ''}
                      >
                        Reduce Motion
                      </Label>
                    </div>
                    <Switch 
                      id="reduce-motion"
                      checked={accessibilityPreferences.uiPreferences.reduceMotion}
                      onCheckedChange={handleReduceMotionChange}
                      className={highContrast ? 'data-[state=checked]:bg-black' : ''}
                    />
                  </div>
                  
                  {/* Always Show Labels */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label 
                        htmlFor="always-show-labels"
                        className={largeText ? 'text-base' : ''}
                      >
                        Always Show Map Labels
                      </Label>
                    </div>
                    <Switch 
                      id="always-show-labels"
                      checked={accessibilityPreferences.uiPreferences.alwaysShowLabels}
                      onCheckedChange={handleAlwaysShowLabelsChange}
                      className={highContrast ? 'data-[state=checked]:bg-black' : ''}
                    />
                  </div>
                  
                  {/* Preview section */}
                  <div className={`mt-6 p-4 rounded-md ${highContrast ? 'bg-black text-white' : 'bg-muted'}`}>
                    <h3 className={`${largeText ? 'text-lg' : 'text-base'} font-medium mb-2`}>Preview</h3>
                    <p className={largeText ? 'text-base' : 'text-sm'}>
                      This is how text will appear with your current settings.
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <div className={`w-4 h-4 rounded-full ${highContrast ? 'bg-white' : 'bg-primary'}`}></div>
                      <span>Sample map marker</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Voice settings tab */}
          <TabsContent value="voice">
            <Card className={highContrast ? 'border-2 border-black' : ''}>
              <CardContent className="p-4">
                <h2 className={`${largeText ? 'text-xl' : 'text-lg'} font-semibold mb-4`}>Voice Guidance Settings</h2>
                
                <div className="space-y-6">
                  {/* Enable/disable voice guidance */}
                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="voice-guidance"
                      className={largeText ? 'text-base' : ''}
                    >
                      Enable Voice Guidance
                    </Label>
                    <Switch 
                      id="voice-guidance"
                      checked={accessibilityPreferences.routePreferences.audioGuidance}
                      onCheckedChange={handleAudioGuidanceChange}
                      className={highContrast ? 'data-[state=checked]:bg-black' : ''}
                    />
                  </div>
                  
                  {/* Voice rate slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label 
                        htmlFor="voice-rate"
                        className={largeText ? 'text-base' : ''}
                      >
                        Speaking Rate
                      </Label>
                      <span className={`${largeText ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                        {voiceRate < 0.8 ? "Slow" : voiceRate > 1.1 ? "Fast" : "Normal"}
                      </span>
                    </div>
                    <Slider
                      id="voice-rate"
                      min={0.5}
                      max={1.5}
                      step={0.1}
                      value={[voiceRate]}
                      onValueChange={handleVoiceRateChange}
                      onValueCommit={handleVoiceRateChange}
                      disabled={!accessibilityPreferences.routePreferences.audioGuidance}
                      className={highContrast ? '[&_[role=slider]]:bg-black [&_[role=slider]]:border-white [&_[role=slider]]:border-2' : ''}
                    />
                  </div>
                  
                  {/* Voice pitch slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label 
                        htmlFor="voice-pitch"
                        className={largeText ? 'text-base' : ''}
                      >
                        Voice Pitch
                      </Label>
                      <span className={`${largeText ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                        {voicePitch < 0.9 ? "Low" : voicePitch > 1.1 ? "High" : "Normal"}
                      </span>
                    </div>
                    <Slider
                      id="voice-pitch"
                      min={0.5}
                      max={1.5}
                      step={0.1}
                      value={[voicePitch]}
                      onValueChange={handleVoicePitchChange}
                      onValueCommit={handleVoicePitchChange}
                      disabled={!accessibilityPreferences.routePreferences.audioGuidance}
                      className={highContrast ? '[&_[role=slider]]:bg-black [&_[role=slider]]:border-white [&_[role=slider]]:border-2' : ''}
                    />
                  </div>
                  
                  {/* Voice volume slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label 
                        htmlFor="voice-volume"
                        className={largeText ? 'text-base' : ''}
                      >
                        Volume
                      </Label>
                      <span className={`${largeText ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                        {Math.round(voiceVolume * 100)}%
                      </span>
                    </div>
                    <Slider
                      id="voice-volume"
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      value={[voiceVolume]}
                      onValueChange={handleVoiceVolumeChange}
                      onValueCommit={handleVoiceVolumeChange}
                      disabled={!accessibilityPreferences.routePreferences.audioGuidance}
                      className={highContrast ? '[&_[role=slider]]:bg-black [&_[role=slider]]:border-white [&_[role=slider]]:border-2' : ''}
                    />
                  </div>
                  
                  {/* Test voice button */}
                  <Button 
                    variant={highContrast ? "default" : "outline"} 
                    className={`w-full ${highContrast ? 'bg-black text-white border-2 border-white' : ''} ${largeText ? 'text-lg py-6' : ''}`}
                    onClick={() => speakInstruction("This is a test of the voice guidance system. You will hear directions like this during navigation.", {
                      rate: voiceRate,
                      pitch: voicePitch,
                      volume: voiceVolume
                    })}
                    disabled={!accessibilityPreferences.routePreferences.audioGuidance}
                  >
                    Test Voice
                  </Button>
                  
                  {/* Save settings button */}
                  <Button 
                    className={`w-full ${highContrast ? 'bg-black text-white border-2 border-white' : ''} ${largeText ? 'text-lg py-6' : ''}`}
                    onClick={handleSaveVoiceSettings}
                    disabled={!accessibilityPreferences.routePreferences.audioGuidance}
                  >
                    Save Voice Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Saved places tab */}
          <TabsContent value="saved">
            {savedPlaces.length > 0 ? (
              <div className="space-y-4">
                {savedPlaces.map((place) => (
                  <div key={place.id} className="relative">
                    <PlaceCard 
                      place={{
                        id: place.id!,
                        name: place.name,
                        address: place.address || '',
                        coordinates: [place.latitude, place.longitude],
                        placeType: place.placeType,
                        accessibilityFeatures: place.accessibilityFeatures 
                          ? JSON.parse(place.accessibilityFeatures)
                          : []
                      }} 
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveSavedPlace(place.id!)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className={`text-muted-foreground ${largeText ? 'text-lg' : ''}`}>No saved places yet</p>
                <Button 
                  variant={highContrast ? "default" : "outline"} 
                  className={`mt-4 ${highContrast ? 'bg-black text-white border-2 border-white' : ''} ${largeText ? 'text-lg py-6' : ''}`}
                  onClick={() => navigate('/nearby')}
                >
                  Explore Nearby Places
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

export default ProfilePage;