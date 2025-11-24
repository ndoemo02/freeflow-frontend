// components/ChatBubbles.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  restaurants?: Array<{ id: string; name: string; cuisine_type?: string; city?: string }>;
  locationRestaurants?: Array<{ id: string; name: string; cuisine_type?: string; city?: string }>;
  menuItems?: Array<{ id: string; name: string; price_pln: number; category?: string }>;
}

interface ChatBubblesProps {
  userMessage?: string;
  amberResponse?: string;
  restaurants?: Array<{ id: string; name: string; cuisine_type?: string; city?: string }>;
  menuItems?: Array<{ id: string; name: string; price_pln: number; category?: string }>;
  onRestaurantSelect?: (restaurant: any) => void;
  onMenuItemSelect?: (item: any) => void;
}

export default function ChatBubbles({
  userMessage,
  amberResponse,
  restaurants,
  menuItems,
  onRestaurantSelect,
  onMenuItemSelect
}: ChatBubblesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const lastMessageRef = React.useRef<string | null>(null);

  // 🔍 DEBUG: Log incoming props
  useEffect(() => {
    console.log("🔍 ChatBubbles received props:", {
      hasUserMessage: !!userMessage,
      hasAmberResponse: !!amberResponse,
      hasRestaurants: !!restaurants,
      restaurantsLength: restaurants?.length || 0,
      hasMenuItems: !!menuItems,
      menuItemsLength: menuItems?.length || 0,
      restaurants,
      menuItems
    });
  }, [userMessage, amberResponse, restaurants, menuItems]);

  // Scroll do ostatniej wiadomości
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Dodaj wiadomość użytkownika
  useEffect(() => {
    if (userMessage?.trim()) {
      const newMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        text: userMessage,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => {
        if (lastMessageRef.current === newMessage.text) return prev;
        lastMessageRef.current = newMessage.text;
        return [...prev, newMessage];
      });
    }
  }, [userMessage]);

  // Dodaj odpowiedź Amber
  useEffect(() => {
    if (amberResponse?.trim()) {
      const newMessage: ChatMessage = {
        id: `amber-${Date.now()}`,
        text: amberResponse,
        isUser: false,
        timestamp: new Date(),
        restaurants: restaurants,
        locationRestaurants: restaurants,
        menuItems: menuItems,
      };
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];

        // Check if it's the same message content
        if (lastMsg && lastMsg.text === newMessage.text && !lastMsg.isUser) {
          // Check if we gained restaurants or menu items that were previously missing
          const gainedRestaurants = (!lastMsg.restaurants?.length && newMessage.restaurants?.length);
          const gainedMenu = (!lastMsg.menuItems?.length && newMessage.menuItems?.length);

          if (gainedRestaurants || gainedMenu) {
            console.log("🔄 Updating last message with new data (restaurants/menu)");
            // Replace the last message with the new one (enriched)
            return [...prev.slice(0, -1), newMessage];
          }
          // Otherwise, it's just a duplicate text, ignore
          return prev;
        }

        lastMessageRef.current = newMessage.text;
        return [...prev, newMessage];
      });
    }
  }, [amberResponse, restaurants, menuItems]);

  return (
    <StyledChatContainer>
      <ChatMessages>
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <ChatBubble
              key={`${message.id}-${index}`}
              message={message}
              index={index}
              onRestaurantSelect={onRestaurantSelect}
              onMenuItemSelect={onMenuItemSelect}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </ChatMessages>
    </StyledChatContainer>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
  index: number;
  onRestaurantSelect?: (restaurant: any) => void;
  onMenuItemSelect?: (item: any) => void;
}

import ResultCarousel from './ResultCarousel';

function ChatBubble({ message, index, onRestaurantSelect, onMenuItemSelect }: ChatBubbleProps) {
  const isUser = message.isUser;
  // Fallback for different property names from backend
  const restaurants = message.locationRestaurants || message.restaurants;
  const menuItems = message.menuItems || (message as any).menu || [];

  const hasRestaurants = Array.isArray(restaurants) && restaurants.length > 0;
  const hasMenu = Array.isArray(menuItems) && menuItems.length > 0;

  return (
    <StyledBubbleWrapper
      $isUser={isUser}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: index * 0.05
      }}
    >
      <StyledBubble $isUser={isUser}>
        <BubbleContent>
          {message.text && (
            <BubbleText $isUser={isUser}>
              {message.text}
            </BubbleText>
          )}
        </BubbleContent>
      </StyledBubble>

      {/* Render ResultCarousel INSIDE the bubble wrapper but outside the text bubble */}
      {hasRestaurants && (
        <ResultCarousel
          items={restaurants}
          type="restaurant"
          onItemClick={(restaurant) => {
            console.log('🍽️ Restaurant selected:', restaurant);
            onRestaurantSelect?.(restaurant);
          }}
        />
      )}

      {!isUser && hasMenu && (
        <ResultCarousel
          items={menuItems}
          type="menu"
          onItemClick={(item) => {
            console.log('🍕 Menu item selected:', item);
            onMenuItemSelect?.(item);
          }}
        />
      )}

      <BubbleTimestamp>
        {message.timestamp.toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </BubbleTimestamp>
    </StyledBubbleWrapper>
  );
}

// Styled Components
const StyledChatContainer = styled.div`
  position: fixed;
  top: clamp(100px, 12vh, 130px);
  bottom: calc(140px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1000px;
  padding: 0 24px;
  pointer-events: none;
  z-index: 30;
  display: flex;
  justify-content: center;
  overflow: hidden;
`;

const ChatMessages = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 2rem;
  
  /* Hide scrollbar but allow scrolling */
  scrollbar-width: none; 
  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledBubbleWrapper = styled(motion.div) <{ $isUser: boolean }>`
  display: flex;
  width: 100%;
  justify-content: ${props => (props.$isUser ? 'flex-end' : 'flex-start')};
  flex-direction: column;
  align-items: ${props => (props.$isUser ? 'flex-end' : 'flex-start')};
  pointer-events: auto;
`;

const StyledBubble = styled.div<{ $isUser: boolean }>`
  background: ${props => props.$isUser
    ? 'rgba(0, 20, 40, 0.6)'
    : 'rgba(20, 0, 40, 0.6)'};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  border-radius: ${props => props.$isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px'};
  padding: 16px 20px;
  
  border: 1px solid ${props => props.$isUser
    ? 'rgba(0, 240, 255, 0.15)'
    : 'rgba(255, 0, 170, 0.15)'};
    
  box-shadow: ${props => props.$isUser
    ? '0 0 15px rgba(0, 240, 255, 0.05), inset 0 0 20px rgba(0, 240, 255, 0.02)'
    : '0 0 15px rgba(255, 0, 170, 0.05), inset 0 0 20px rgba(255, 0, 170, 0.02)'};
    
  position: relative;
  max-width: 75%;
  transition: all 0.3s ease;

  /* Neon glow on hover */
  &:hover {
    border-color: ${props => props.$isUser
    ? 'rgba(0, 240, 255, 0.3)'
    : 'rgba(255, 0, 170, 0.3)'};
    box-shadow: ${props => props.$isUser
    ? '0 0 20px rgba(0, 240, 255, 0.1)'
    : '0 0 20px rgba(255, 0, 170, 0.1)'};
  }

  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

const BubbleContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BubbleText = styled.div<{ $isUser: boolean }>`
  color: ${props => props.$isUser ? '#e0faff' : '#ffe0f5'};
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;
  white-space: pre-wrap;
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
`;

const BubbleTimestamp = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 6px;
  padding: 0 4px;
`;

// Lista restauracji
const RestaurantsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const RestaurantItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 0, 170, 0.3);
    transform: translateX(4px);
  }
`;

const RestaurantName = styled.div`
  color: #ff00aa;
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 2px;
  text-shadow: 0 0 10px rgba(255, 0, 170, 0.3);
`;

const RestaurantCuisine = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
`;

const RestaurantCity = styled.div`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
`;

