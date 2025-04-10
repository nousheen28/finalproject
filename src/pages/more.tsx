import React from 'react';
import { Header } from '@/components/navigation/Header';
import { NavigationBar } from '@/components/navigation/NavigationBar';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Moon, 
  Bell, 
  Lock, 
  HelpCircle, 
  Info, 
  ChevronRight,
  Github,
  Twitter,
  Mail
} from 'lucide-react';
import { useAppContext } from '@/lib/context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const MorePage = () => {
  const { darkMode, toggleDarkMode } = useAppContext();

  const menuItems = [
    {
      title: 'Settings',
      icon: Settings,
      items: [
        {
          title: 'Dark Mode',
          icon: Moon,
          action: 'toggle',
          state: darkMode,
          onChange: toggleDarkMode
        },
        {
          title: 'Notifications',
          icon: Bell,
          link: '/notifications'
        }
      ]
    },
    {
      title: 'Support',
      icon: HelpCircle,
      items: [
        {
          title: 'Help Center',
          icon: HelpCircle,
          link: '/help'
        },
        {
          title: 'Privacy Policy',
          icon: Lock,
          link: '/privacy'
        },
        {
          title: 'About AccessNow',
          icon: Info,
          link: '/about'
        }
      ]
    },
    {
      title: 'Connect',
      icon: Github,
      items: [
        {
          title: 'GitHub',
          icon: Github,
          externalLink: 'https://github.com'
        },
        {
          title: 'Twitter',
          icon: Twitter,
          externalLink: 'https://twitter.com'
        },
        {
          title: 'Contact Us',
          icon: Mail,
          link: '/contact'
        }
      ]
    }
  ];

  return (
    <main className="w-full min-h-screen bg-background text-foreground pb-16">
      <Header title="More" />
      
      <div className="p-4">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <section.icon className="h-5 w-5 mr-2" />
              {section.title}
            </h2>
            
            <div className="space-y-2">
              {section.items.map((item, itemIndex) => (
                <div 
                  key={itemIndex}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>{item.title}</span>
                  </div>
                  
                  {item.action === 'toggle' ? (
                    <Switch 
                      checked={item.state} 
                      onCheckedChange={item.onChange} 
                    />
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      asChild={!!item.link || !!item.externalLink}
                    >
                      {item.link ? (
                        <a href={item.link}>
                          <ChevronRight className="h-5 w-5" />
                        </a>
                      ) : item.externalLink ? (
                        <a href={item.externalLink} target="_blank" rel="noopener noreferrer">
                          <ChevronRight className="h-5 w-5" />
                        </a>
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>AccessNow v1.0.0</p>
          <p className="mt-1">© 2023 AccessNow. All rights reserved.</p>
        </div>
      </div>
      
      <NavigationBar />
    </main>
  );
};

export default MorePage;