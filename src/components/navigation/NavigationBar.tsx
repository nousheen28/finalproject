import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Search, Map, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NavigationBar: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Map',
      path: '/',
      icon: Map,
    },
    {
      name: 'Search',
      path: '/search',
      icon: Search,
    },
    {
      name: 'Add',
      path: '/add-place',
      icon: MapPin,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
    },
    {
      name: 'More',
      path: '/more',
      icon: MoreHorizontal,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 flex items-center justify-around px-2 z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-full",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};