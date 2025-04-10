import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Mic } from 'lucide-react';
import { processChatbotQuery, listenForVoiceCommand } from '@/lib/api';
import { useAppContext } from '@/lib/context';
import { speakInstruction } from '@/lib/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your accessibility assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { accessibilityPreferences } = useAppContext();
  const stopListeningRef = useRef<() => void>(() => {});

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Process the query and get a response
    setTimeout(() => {
      const response = processChatbotQuery(userMessage.text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // If audio guidance is enabled, speak the response
      if (accessibilityPreferences.routePreferences.audioGuidance) {
        speakInstruction(response);
      }
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const startVoiceInput = () => {
    if (isListening) {
      stopListeningRef.current();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    stopListeningRef.current = listenForVoiceCommand((text) => {
      setInputValue(text);
      setIsListening(false);
      
      // Auto-send after voice input
      setTimeout(() => {
        const userMessage: Message = {
          id: Date.now().toString(),
          text,
          sender: 'user',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Process the query and get a response
        setTimeout(() => {
          const response = processChatbotQuery(text);
          
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response,
            sender: 'bot',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, botMessage]);
          
          // If audio guidance is enabled, speak the response
          if (accessibilityPreferences.routePreferences.audioGuidance) {
            speakInstruction(response);
          }
        }, 500);
      }, 300);
    });
  };

  // Determine styles based on accessibility preferences
  const highContrast = accessibilityPreferences.uiPreferences.highContrast;
  const largeText = accessibilityPreferences.uiPreferences.largeText;

  return (
    <>
      {/* Chat button */}
      <Button
        className={`fixed bottom-20 right-4 rounded-full h-14 w-14 shadow-lg z-40 ${
          isOpen ? 'bg-destructive hover:bg-destructive/90' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <Card className={`fixed bottom-36 right-4 w-80 sm:w-96 h-96 z-40 flex flex-col shadow-lg ${
          highContrast ? 'border-2 border-black' : ''
        }`}>
          {/* Chat header */}
          <div className={`p-3 border-b ${highContrast ? 'bg-black text-white border-white' : 'bg-primary text-primary-foreground'}`}>
            <h3 className={`font-medium ${largeText ? 'text-lg' : ''}`}>Accessibility Assistant</h3>
          </div>

          {/* Messages area */}
          <div className="flex-1 p-3 overflow-y-auto">
            {messages.map(message => (
              <div
                key={message.id}
                className={`mb-3 ${message.sender === 'user' ? 'text-right' : ''}`}
              >
                <div
                  className={`inline-block rounded-lg px-3 py-2 max-w-[80%] ${
                    message.sender === 'user'
                      ? highContrast
                        ? 'bg-black text-white'
                        : 'bg-primary text-primary-foreground'
                      : highContrast
                      ? 'bg-gray-200 text-black'
                      : 'bg-muted'
                  }`}
                >
                  <p className={largeText ? 'text-base' : 'text-sm'}>{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 border-t flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              className={largeText ? 'text-base' : ''}
            />
            <Button
              size="icon"
              variant={isListening ? "destructive" : "default"}
              onClick={startVoiceInput}
              className={highContrast ? 'bg-black text-white hover:bg-gray-800' : ''}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={highContrast ? 'bg-black text-white hover:bg-gray-800' : ''}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};