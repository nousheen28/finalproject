import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mic, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listenForVoiceCommand } from '@/lib/api';
import { useAppContext } from '@/lib/context';
import { searchLocations } from '@/lib/api';
import { Card } from '@/components/ui/card';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  showResults?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search location',
  className = '',
  showResults = true,
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const stopListeningRef = useRef<() => void>(() => {});
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { accessibilityPreferences, setDestination } = useAppContext();
  
  // Focus input on mount if high contrast mode is enabled
  useEffect(() => {
    if (accessibilityPreferences.uiPreferences.highContrast && inputRef.current) {
      inputRef.current.focus();
    }
  }, [accessibilityPreferences.uiPreferences.highContrast]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchLocations(searchQuery);
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
      setShowDropdown(results.length > 0 && showResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
      setShowDropdown(false);
    }
  };

  const handleResultClick = (result: any) => {
    setQuery(result.display_name);
    setShowDropdown(false);
    
    // Set destination and navigate to map
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setDestination([lat, lon]);
    
    // Navigate to search results page with the selected location
    navigate(`/search?q=${encodeURIComponent(result.display_name)}&lat=${lat}&lon=${lon}`);
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
        performSearch(text);
      }, 300);
    });
    
    // Provide feedback that voice search has started
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };
  
  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setShowDropdown(false);
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
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative flex items-center">
        <Search className={`absolute left-3 ${iconClasses}`} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputClasses}
          aria-label="Search location"
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
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
      </form>

      {/* Search results dropdown */}
      {showDropdown && (
        <Card 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg"
        >
          <div className="p-1">
            {isSearching ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="font-medium">{result.display_name.split(',')[0]}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.display_name}
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
};