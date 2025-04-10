import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/navigation/Header';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { fine } from '@/lib/fine';
import { CheckCircle } from 'lucide-react';
import type { PlaceDetails } from '@/lib/api';

const ReportProblemPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [place] = useState<PlaceDetails>(location.state?.place);
  const [reportType, setReportType] = useState('incorrect_info');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { data: session } = fine.auth.useSession();

  if (!place) {
    // Redirect to home if no place data
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please log in to report a problem",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    if (!description) {
      toast({
        title: "Description required",
        description: "Please provide details about the issue",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First ensure the place exists in our database
      let placeId = place.id;
      const existingPlaces = await fine.table("places").select()
        .eq("latitude", place.coordinates[0])
        .eq("longitude", place.coordinates[1]);
      
      if (!existingPlaces || existingPlaces.length === 0) {
        // Create the place first
        const newPlaces = await fine.table("places").insert({
          name: place.name,
          address: place.address,
          latitude: place.coordinates[0],
          longitude: place.coordinates[1],
          placeType: place.placeType,
          accessibilityFeatures: JSON.stringify(place.accessibilityFeatures),
          osmId: place.osmId
        }).select();
        
        if (newPlaces && newPlaces.length > 0) {
          placeId = newPlaces[0].id!;
        }
      } else {
        placeId = existingPlaces[0].id!;
      }
      
      // Save the report
      await fine.table("accessibilityReports").insert({
        placeId: Number(placeId),
        userId: Number(session.user.id),
        reportType,
        description
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <main className="w-full min-h-screen bg-background text-foreground pb-16">
        <Header title="Report A Problem" />
        
        <div className="p-4 flex flex-col items-center justify-center h-[70vh] text-center">
          <div className="bg-green-100 dark:bg-green-900 rounded-full p-4 mb-4">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-300" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Review Added Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for visiting this place..
          </p>
          <Button onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
        
        <NavigationBar />
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-background text-foreground pb-16">
      <Header title="Report A Problem" />
      
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">{place.name}</h2>
        <p className="text-sm text-muted-foreground mb-6">{place.address}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Report type */}
          <div>
            <Label className="block mb-3">What's the issue?</Label>
            <RadioGroup value={reportType} onValueChange={setReportType}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="incorrect_info" id="incorrect_info" />
                <Label htmlFor="incorrect_info">Incorrect accessibility information</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="temporary_issue" id="temporary_issue" />
                <Label htmlFor="temporary_issue">Temporary accessibility issue</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="place_closed" id="place_closed" />
                <Label htmlFor="place_closed">Place permanently closed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other issue</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Description */}
          <div>
            <Label htmlFor="description">Describe the problem</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about the issue..."
              className="min-h-[150px]"
              required
            />
          </div>
          
          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </div>
      
      <NavigationBar />
    </main>
  );
};

export default ReportProblemPage;