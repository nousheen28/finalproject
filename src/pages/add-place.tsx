import React, { useState } from 'react';
import { Header } from '@/components/navigation/Header';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapView } from '@/components/map/MapView';
import { useAppContext } from '@/lib/context';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, X } from 'lucide-react';
import { AccessibilityFeatureType } from '@/lib/accessibility-types';
import { fine } from '@/lib/fine';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '@/lib/api';

const AddPlacePage = () => {
  const { currentLocation, temporaryMarker } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: session } = fine.auth.useSession();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    placeType: 'restaurant',
    coordinates: currentLocation || [0, 0],
  });
  
  const [selectedFeatures, setSelectedFeatures] = useState<AccessibilityFeatureType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  
  const featureOptions: { value: AccessibilityFeatureType; label: string }[] = [
    { value: 'elevator', label: 'Elevator' },
    { value: 'ramp', label: 'Ramp' },
    { value: 'automatic_doors', label: 'Automatic Doors' },
    { value: 'handrails', label: 'Handrails' },
    { value: 'accessible_toilet', label: 'Accessible Washroom' },
    { value: 'braille', label: 'Braille' },
    { value: 'sign_language', label: 'Sign Language' },
    { value: 'hearing_loop', label: 'Hearing Loop' },
    { value: 'quiet_space', label: 'Quiet' },
    { value: 'spacious', label: 'Spacious' },
    { value: 'service_animal', label: 'Animal Friendly' },
    { value: 'stopgap_ramp', label: 'StopGap Ramp' },
    { value: 'digital_menu', label: 'Digital Menu' },
    { value: 'outdoor_access_only', label: 'Outdoor Access Only' },
  ];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const toggleFeature = (feature: AccessibilityFeatureType) => {
    setSelectedFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };
  
  const handleMapClick = (latlng: [number, number]) => {
    setFormData(prev => ({ ...prev, coordinates: latlng }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...newFiles]);
      
      // Create preview URLs
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };
  
  const removePhoto = (index: number) => {
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    // Remove photo and preview
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add a place",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    if (!formData.name) {
      toast({
        title: "Name required",
        description: "Please enter a name for the place",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload photos if any
      const photoUrls: string[] = [];
      
      if (photos.length > 0) {
        for (const photo of photos) {
          try {
            const photoUrl = await uploadFile(photo);
            photoUrls.push(photoUrl);
          } catch (error) {
            console.error("Error uploading photo:", error);
            toast({
              title: "Photo upload failed",
              description: "One or more photos could not be uploaded",
              variant: "destructive"
            });
          }
        }
      }
      
      // Create accessibility features array
      const accessibilityFeatures = featureOptions.map(feature => ({
        type: feature.value,
        available: selectedFeatures.includes(feature.value)
      }));
      
      // Get coordinates from temporary marker if available
      let coordinates = formData.coordinates;
      if (temporaryMarker) {
        const latlng = temporaryMarker.getLatLng();
        coordinates = [latlng.lat, latlng.lng] as [number, number];
      }
      
      // Save to database
      await fine.table("places").insert({
        name: formData.name,
        address: formData.address,
        latitude: coordinates[0],
        longitude: coordinates[1],
        placeType: formData.placeType,
        accessibilityFeatures: JSON.stringify(accessibilityFeatures),
        photos: photoUrls.length > 0 ? JSON.stringify(photoUrls) : undefined
      });
      
      toast({
        title: "Place added",
        description: "Thank you for contributing to accessibility data!"
      });
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        description: '',
        placeType: 'restaurant',
        coordinates: currentLocation || [0, 0],
      });
      setSelectedFeatures([]);
      setPhotos([]);
      setPhotoPreviewUrls([]);
      
      // Navigate back
      navigate('/');
    } catch (error) {
      console.error("Error adding place:", error);
      toast({
        title: "Error",
        description: "Failed to add place. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="w-full min-h-screen bg-background text-foreground pb-16">
      <Header title="Add Place" />
      
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Map for location selection */}
          <div className="h-48 mb-4 rounded-lg overflow-hidden border border-border">
            <MapView 
              height="h-full" 
              showNearbyPlaces={false} 
              onMapClick={handleMapClick}
            />
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>
              {temporaryMarker ? 
                `Selected location: ${temporaryMarker.getLatLng().lat.toFixed(6)}, ${temporaryMarker.getLatLng().lng.toFixed(6)}` :
                `Current location: ${formData.coordinates[0].toFixed(6)}, ${formData.coordinates[1].toFixed(6)}`
              }
            </span>
          </div>
          
          {/* Basic info */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Place Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Cafe Accessibility"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Full address"
              />
            </div>
            
            <div>
              <Label htmlFor="placeType">Place Type</Label>
              <select
                id="placeType"
                name="placeType"
                value={formData.placeType}
                onChange={handleInputChange}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Cafe</option>
                <option value="shop">Shop</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          {/* Accessibility features */}
          <div>
            <Label className="block mb-2">Accessibility Features</Label>
            <div className="flex flex-wrap gap-2">
              {featureOptions.map((feature) => (
                <Button
                  key={feature.value}
                  type="button"
                  variant={selectedFeatures.includes(feature.value) ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => toggleFeature(feature.value)}
                >
                  {feature.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Description */}
          <div>
            <Label htmlFor="description">Describe about your property</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add details about accessibility features, entrance information, etc."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {1000 - formData.description.length} characters remaining
            </p>
          </div>
          
          {/* Photo upload */}
          <div>
            <Label htmlFor="photos" className="block mb-2">Add Photos</Label>
            <div className="flex items-center gap-2">
              <label htmlFor="photos" className="cursor-pointer">
                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center">
                    <Camera className="h-6 w-6 mb-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload photos</span>
                  </div>
                </div>
                <input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Photo previews */}
            {photoPreviewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Done"}
          </Button>
        </form>
      </div>
      
      <NavigationBar />
    </main>
  );
};

export default AddPlacePage;