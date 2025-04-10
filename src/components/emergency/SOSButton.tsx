import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppContext } from '@/lib/context';
import { useToast } from '@/hooks/use-toast';

export const SOSButton: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { currentLocation } = useAppContext();
  const { toast } = useToast();

  const handleSOS = async () => {
    setIsSending(true);
    
    try {
      // In a real app, this would send the location to emergency contacts
      // For this demo, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Emergency alert sent",
        description: "Your location has been shared with your emergency contacts.",
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to send alert",
        description: "Please try again or call emergency services directly.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        className="fixed bottom-20 right-4 rounded-full h-14 w-14 shadow-lg z-40"
        onClick={() => setIsDialogOpen(true)}
      >
        <AlertTriangle className="h-6 w-6" />
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Emergency Alert</DialogTitle>
            <DialogDescription>
              This will share your current location with your emergency contacts.
            </DialogDescription>
          </DialogHeader>
          
          {currentLocation && (
            <div className="py-2">
              <p className="text-sm font-medium">Your current location:</p>
              <p className="text-sm text-muted-foreground">
                Latitude: {currentLocation[0].toFixed(6)}, Longitude: {currentLocation[1].toFixed(6)}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSOS}
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send SOS Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};