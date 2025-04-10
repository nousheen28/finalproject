// Types of disabilities that can be selected in user preferences
export type DisabilityType = 
  | 'wheelchair'
  | 'visual'
  | 'hearing'
  | 'cognitive'
  | 'mobility'
  | 'none';

// Accessibility features that can be found at places
export type AccessibilityFeatureType =
  | 'wheelchair'
  | 'ramp'
  | 'elevator'
  | 'braille'
  | 'sign_language'
  | 'hearing_loop'
  | 'tactile_paving'
  | 'accessible_toilet'
  | 'handrails'
  | 'automatic_doors'
  | 'wide_entrance'
  | 'low_counter'
  | 'quiet_space'
  | 'bright_lighting'
  | 'scent_free'
  | 'service_animal'
  | 'staff_assistance'
  | 'alternative_entrance'
  | 'parking'
  | 'stopgap_ramp'
  | 'gender_neutral_washroom'
  | 'spacious'
  | 'large_print'
  | 'outdoor_access_only'
  | 'digital_menu'
  | 'smooth_terrain'
  | 'no_stairs';

// Mobility aid types
export type MobilityAidType = 'none' | 'manual_wheelchair' | 'power_wheelchair' | 'walker' | 'cane';

// User accessibility preferences
export interface AccessibilityPreferences {
  disabilityTypes: DisabilityType[];
  requiredFeatures: AccessibilityFeatureType[];
  avoidFeatures: string[]; // Things to avoid (e.g., "stairs", "crowds", "flashing_lights")
  mobilityAid?: MobilityAidType; // Type of mobility aid used
  routePreferences: {
    maxSlope?: number; // Maximum acceptable slope in percentage
    minWidth?: number; // Minimum path width in meters
    avoidStairs: boolean;
    preferElevators: boolean;
    preferRamps: boolean;
    audioGuidance: boolean;
    highContrast: boolean;
    textSize: 'normal' | 'large' | 'extra-large';
    voiceGender?: 'male' | 'female' | 'neutral';
    voiceLanguage?: string;
    preferSmoothTerrain: boolean;
    preferShortestRoute: boolean;
    preferFewestObstacles: boolean;
  };
  uiPreferences: {
    darkMode: boolean;
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    alwaysShowLabels: boolean;
  };
}

// Default accessibility preferences
export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  disabilityTypes: [],
  requiredFeatures: [],
  avoidFeatures: [],
  mobilityAid: 'none',
  routePreferences: {
    avoidStairs: false,
    preferElevators: false,
    preferRamps: false,
    audioGuidance: false,
    highContrast: false,
    textSize: 'normal',
    preferSmoothTerrain: false,
    preferShortestRoute: true,
    preferFewestObstacles: false
  },
  uiPreferences: {
    darkMode: false,
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    alwaysShowLabels: true
  }
};

// Accessibility feature icons mapping
export const accessibilityFeatureIcons: Record<AccessibilityFeatureType, string> = {
  wheelchair: '♿',
  ramp: '⤴️',
  elevator: '🔼',
  braille: '⠃',
  sign_language: '👐',
  hearing_loop: '👂',
  tactile_paving: '⠿',
  accessible_toilet: '🚻',
  handrails: '‖',
  automatic_doors: '🚪',
  wide_entrance: '↔️',
  low_counter: '⤵️',
  quiet_space: '🔇',
  bright_lighting: '💡',
  scent_free: '🌬️',
  service_animal: '🐕',
  staff_assistance: '👨‍🦯',
  alternative_entrance: '🚶',
  parking: '🅿️',
  stopgap_ramp: '📏',
  gender_neutral_washroom: '🚻',
  spacious: '↔️',
  large_print: '🔍',
  outdoor_access_only: '🌳',
  digital_menu: '📱',
  smooth_terrain: '🛣️',
  no_stairs: '🚫'
};

// Accessibility feature labels
export const accessibilityFeatureLabels: Record<AccessibilityFeatureType, string> = {
  wheelchair: 'Wheelchair Accessible',
  ramp: 'Ramp',
  elevator: 'Elevator',
  braille: 'Braille',
  sign_language: 'Sign Language',
  hearing_loop: 'Hearing Loop',
  tactile_paving: 'Tactile Paving',
  accessible_toilet: 'Accessible Washroom',
  handrails: 'Handrails',
  automatic_doors: 'Automatic Doors',
  wide_entrance: 'Wide Entrance',
  low_counter: 'Low Counter',
  quiet_space: 'Quiet Space',
  bright_lighting: 'Bright Lighting',
  scent_free: 'Scent-free',
  service_animal: 'Service Animal Friendly',
  staff_assistance: 'Staff Assistance',
  alternative_entrance: 'Alternative Entrance',
  parking: 'Accessible Parking',
  stopgap_ramp: 'StopGap Ramp',
  gender_neutral_washroom: 'Gender Neutral Washroom',
  spacious: 'Spacious',
  large_print: 'Large Print',
  outdoor_access_only: 'Outdoor Access Only',
  digital_menu: 'Digital Menu',
  smooth_terrain: 'Smooth Terrain',
  no_stairs: 'No Stairs'
};

// Transport modes
export type TransportMode = 'walking' | 'wheelchair' | 'cane' | 'walker';

// Transport mode icons
export const transportModeIcons: Record<TransportMode, string> = {
  walking: '🚶',
  wheelchair: '♿',
  cane: '🦯',
  walker: '🚶‍♀️'
};

// Transport mode labels
export const transportModeLabels: Record<TransportMode, string> = {
  walking: 'Walking',
  wheelchair: 'Wheelchair',
  cane: 'Using Cane',
  walker: 'Using Walker'
};