import React from 'react';
import { MapView } from '@/components/map/MapView';
import { SearchBar } from '@/components/navigation/SearchBar';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { SOSButton } from '@/components/emergency/SOSButton';
import { ChatAssistant } from '@/components/chatbot/ChatAssistant';
import { useNavigate } from 'react-router-dom';
import { AppProvider } from '@/lib/context';

const Index = () => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <AppProvider>
      <main className="w-full min-h-screen bg-background text-foreground pb-16">
        {/* Top search bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm p-4 shadow-sm">
          <SearchBar onSearch={handleSearch} />
        </div>
        
        {/* Main map view */}
        <div className="pt-16">
          <MapView />
        </div>
        
        {/* Emergency SOS button */}
        <SOSButton />
        
        {/* Chat assistant */}
        <ChatAssistant />
        
        {/* Bottom navigation */}
        <NavigationBar />
      </main>
    </AppProvider>
  );
};

export default Index;