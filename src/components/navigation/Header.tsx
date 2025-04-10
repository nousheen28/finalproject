import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showShareButton?: boolean;
  onShare?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = true,
  showShareButton = false,
  onShare,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    }
  };

  return (
    <header className={`bg-primary text-primary-foreground p-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2 text-primary-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      
      {showShareButton && (
        <Button variant="ghost" size="icon" onClick={handleShare} className="text-primary-foreground">
          <Share2 className="h-5 w-5" />
        </Button>
      )}
    </header>
  );
};