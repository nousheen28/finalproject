import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AccessibilityFeatureType, 
  accessibilityFeatureIcons, 
  accessibilityFeatureLabels 
} from '@/lib/accessibility-types';

interface AccessibilityFeatureBadgeProps {
  featureType: AccessibilityFeatureType;
  size?: 'sm' | 'md' | 'lg';
}

export const AccessibilityFeatureBadge: React.FC<AccessibilityFeatureBadgeProps> = ({
  featureType,
  size = 'md',
}) => {
  const icon = accessibilityFeatureIcons[featureType] || '✓';
  const label = accessibilityFeatureLabels[featureType] || featureType;
  
  // Determine badge style based on feature type
  let variant: 'default' | 'secondary' | 'outline' = 'outline';
  
  if (featureType === 'wheelchair' || featureType === 'accessible_toilet' || featureType === 'elevator') {
    variant = 'default';
  } else if (featureType === 'ramp' || featureType === 'handrails' || featureType === 'braille') {
    variant = 'secondary';
  }
  
  // Determine badge size
  const sizeClass = size === 'sm' ? 'text-xs py-0 px-2' : size === 'lg' ? 'text-sm py-1 px-3' : '';
  
  return (
    <Badge variant={variant} className={sizeClass}>
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  );
};

interface AccessibilityFeaturesListProps {
  features: { type: string; available: boolean }[];
  showUnavailable?: boolean;
}

export const AccessibilityFeaturesList: React.FC<AccessibilityFeaturesListProps> = ({
  features,
  showUnavailable = false,
}) => {
  // Filter features based on availability
  const filteredFeatures = showUnavailable 
    ? features 
    : features.filter(feature => feature.available);
  
  return (
    <div className="flex flex-wrap gap-2">
      {filteredFeatures.map((feature, index) => (
        <AccessibilityFeatureBadge 
          key={index} 
          featureType={feature.type as AccessibilityFeatureType} 
        />
      ))}
      
      {filteredFeatures.length === 0 && (
        <p className="text-sm text-muted-foreground">No accessibility information available</p>
      )}
    </div>
  );
};