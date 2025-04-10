import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mic, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listenForVoiceCommand } from '@/lib/api';
import { useAppContext } from '@/lib/context';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search location',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const stopListeningRef = useRef<() => void>(() => {});
  const inputRef = useRef<HTMLInputElement>(null);
  const { accessibilityPreferences } = useAppContext();
  
  // Focus input on mount if high contrast mode is enabled
  useEffect(() => {
    if (accessibilityPreferences.uiPreferences.highContrast && inputRef.current) {
      inputRef.current.focus();
    }
  }, [accessibilityPreferences.uiPreferences.highContrast]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  };

  const startVoiceSearch = () => {
    if (isListening) {
      stopListeningRef.current();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    stopListeningRef.current = listenForVoiceCommand((text) => {
      setQuery(text);
      setIsListening(false);
      
      // Auto-search after voice input
      setTimeout(() => {
        if (onSearch) {
          onSearch(text);
        } else {
          navigate(`/search?q=${encodeURIComponent(text)}`);
        }
      }, 500);
    });
    
    // Provide feedback that voice search has started
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };
  
  const clearSearch = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Determine styles based on accessibility preferences
  const highContrast = accessibilityPreferences.uiPreferences.highContrast;
  const largeText = accessibilityPreferences.uiPreferences.largeText;
  
  const inputClasses = `
    pl-9 pr-12 
    ${largeText ? 'h-12 text-lg' : 'h-10'} 
    rounded-full 
    ${highContrast ? 'bg-white border-2 border-black text-black' : 'bg-background border-border'}
  `;
  
  const iconClasses = `
    ${largeText ? 'h-5 w-5' : 'h-4 w-4'} 
    ${highContrast ? 'text-black' : 'text-muted-foreground'}
  `;
  
  const buttonClasses = `
    ${largeText ? 'h-10 w-10' : 'h-8 w-8'} 
    ${highContrast ? 'bg-black text-white hover:bg-gray-800' : ''}
  `;

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className={`absolute left-3 ${iconClasses}`} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputClasses}
          aria-label="Search location"
        />
        {query && (
          <Button
            type="button"
            variant={highContrast ? "default" : "ghost"}
            size="icon"
            className={`absolute right-10 ${buttonClasses}`}
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X className={iconClasses} />
          </Button>
        )}
        <Button
          type="button"
          variant={highContrast ? "default" : "ghost"}
          size="icon"
          className={`absolute right-1 ${buttonClasses} ${isListening ? 'text-red-500' : ''}`}
          onClick={startVoiceSearch}
          aria-label="Voice search"
        >
          <Mic className={iconClasses} />
        </Button>
      </div>
    </form>
  );
};