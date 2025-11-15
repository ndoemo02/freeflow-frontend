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
  menuItems?: Array<{ id: string; name: string; price_pln: number; category?: string }>;
}

interface ChatBubblesProps {
  userMessage?: string;
  amberResponse?: string;
  restaurants?: Array<{ id: string; name: string; cuisine_type?: string; city?: string }>;
  menuItems?: Array<{ id: string; name: string; price_pln: number; category?: string }>;
}

export default function ChatBubbles({ 
  userMessage, 
  amberResponse, 
  restaurants, 
  menuItems 
}: ChatBubblesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

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
      setMessages(prev => [...prev, newMessage]);
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
        menuItems: menuItems,
      };
      setMessages(prev => [...prev, newMessage]);
    }
  }, [amberResponse, restaurants, menuItems]);

  return (
    <StyledChatContainer>
      <ChatMessages>
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id}
              message={message}
              index={index}
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
}

function ChatBubble({ message, index }: ChatBubbleProps) {
  const isUser = message.isUser;
  const hasList = (message.restaurants?.length || 0) > 0 || (message.menuItems?.length || 0) > 0;

  return (
    <StyledBubbleWrapper
      $isUser={isUser}
      initial={{ opacity: 0, y: 15, scale: 0.96, x: isUser ? -20 : 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: isUser ? -10 : 10, transition: { duration: 0.2 } }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.03,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <StyledBubble $isUser={isUser}>
        {/* Efekt mydlanej bańki - tylko dla Amber */}
        {!isUser && (
          <>
            <SoapBubbleLayer1 />
            <SoapBubbleLayer2 />
            <SoapBubbleHighlight />
          </>
        )}
        <BubbleContent>
          {message.text && (
            <BubbleText $isUser={isUser}>
              {message.text}
            </BubbleText>
          )}

          {/* Lista restauracji z animacją */}
          {message.restaurants && message.restaurants.length > 0 && (
            <RestaurantsList>
              {message.restaurants.map((restaurant, idx) => (
            <motion.div
              key={restaurant.id || idx}
              initial={{ opacity: 0, x: isUser ? -10 : 10, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ 
                delay: idx * 0.08, 
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
                  <RestaurantItem>
                    <RestaurantName>{restaurant.name}</RestaurantName>
                    {restaurant.cuisine_type && (
                      <RestaurantCuisine>{restaurant.cuisine_type}</RestaurantCuisine>
                    )}
                    {restaurant.city && (
                      <RestaurantCity>{restaurant.city}</RestaurantCity>
                    )}
                  </RestaurantItem>
                </motion.div>
              ))}
            </RestaurantsList>
          )}

          {/* Lista pozycji menu - UKRYTA (zasłania UI) - można włączyć później jeśli potrzeba */}
          {/* {message.menuItems && message.menuItems.length > 0 && (
            <MenuItemsList>
              {message.menuItems.map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: idx * 0.06, 
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  <MenuItem>
                    <MenuItemName>{item.name}</MenuItemName>
                    <MenuItemPrice>{Number(item.price_pln).toFixed(2)} zł</MenuItemPrice>
                    {item.category && (
                      <MenuItemCategory>{item.category}</MenuItemCategory>
                    )}
                  </MenuItem>
                </motion.div>
              ))}
            </MenuItemsList>
          )} */}
        </BubbleContent>
      </StyledBubble>
      
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
  top: 80px;
  left: 0;
  right: 0;
  bottom: calc(120px + env(safe-area-inset-bottom));
  pointer-events: none;
  z-index: 30;
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0 10px;

  @media (max-width: 768px) {
    padding: 0 14px;
  }
`;

const ChatMessages = styled.div`
  width: min(1200px, 100%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 1rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const StyledBubbleWrapper = styled(motion.div)<{ $isUser: boolean }>`
  display: flex;
  width: 100%;
  justify-content: ${props => (props.$isUser ? 'flex-start' : 'flex-end')};
  /* Kolumna tylko dla timestampu pod dymkiem */
  flex-direction: column;
  align-items: ${props => (props.$isUser ? 'flex-start' : 'flex-end')};
  pointer-events: auto;
  /* Bąbel sam ma stałą szerokość – wrapper rozciąga się na całą szerokość,
     aby dymek był „rozciągnięty w poziomie” i wyrównany do lewej/prawej */
  max-width: 100%;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const StyledBubble = styled.div<{ $isUser: boolean }>`
  background: ${props =>
    props.$isUser
      ? 'linear-gradient(135deg, rgba(6, 20, 33, 0.9), rgba(10, 30, 45, 0.85))'
      : 'linear-gradient(135deg, rgba(149, 89, 255, 0.9), rgba(95, 42, 167, 0.85))'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: ${props => (props.$isUser ? '24px 24px 24px 6px' : '24px 24px 6px 24px')};
  padding: clamp(0.85rem, 2vw, 1.15rem) clamp(1rem, 2vw, 1.4rem);
  border: ${props =>
    props.$isUser
      ? '1px solid rgba(0, 255, 242, 0.25)'
      : '1px solid rgba(212, 153, 255, 0.35)'};
  box-shadow: none;
  position: relative;
  word-wrap: break-word;
  transition: all 0.3s ease;
  overflow: hidden;
  max-width: 70%;
  
  @media (max-width: 900px) {
    max-width: 85%;
  }
`;

// Warstwa 1: Backdrop blur z gradientem (podstawowa przezroczystość)
const SoapBubbleLayer1 = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 24px 24px 6px 24px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(200, 150, 255, 0.2) 50%,
    rgba(100, 200, 255, 0.2) 100%
  );
  opacity: 0.8;
  border: 1px solid rgba(255, 255, 255, 0.4);
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 0;
`;

// Warstwa 2: Conic gradient (efekt tęczy)
const SoapBubbleLayer2 = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 24px 24px 6px 24px;
  background: conic-gradient(
    from 180deg at 50% 50%,
    rgba(255, 0, 150, 0.4) 0%,
    rgba(0, 255, 255, 0.4) 25%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 0, 150, 0.4) 75%,
    rgba(255, 0, 150, 0.4) 100%
  );
  opacity: 0.4;
  mix-blend-mode: lighten;
  filter: blur(2px);
  pointer-events: none;
  z-index: 1;
  animation: rotateGradient 20s linear infinite;
  
  @keyframes rotateGradient {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Highlight: Biały refleks (efekt światła na bańce)
const SoapBubbleHighlight = styled.div`
  position: absolute;
  top: 15%;
  left: 25%;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.6);
  filter: blur(40px);
  border-radius: 50%;
  opacity: 0.7;
  pointer-events: none;
  z-index: 2;
  animation: floatHighlight 3s ease-in-out infinite;
  
  @keyframes floatHighlight {
    0%, 100% {
      transform: translate(0, 0) scale(1);
      opacity: 0.7;
    }
    50% {
      transform: translate(10px, -10px) scale(1.1);
      opacity: 0.5;
    }
  }
`;

const BubbleContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  z-index: 3;
`;

const BubbleText = styled.div<{ $isUser: boolean }>`
  color: ${props => (props.$isUser ? '#b8fffb' : '#f7ecff')};
  font-size: clamp(0.9rem, 2vw, 1rem);
  line-height: 1.55;
  font-weight: 400;
  white-space: pre-wrap;
  word-wrap: break-word;
  text-shadow: ${props =>
    props.$isUser
      ? '0 0 12px rgba(223, 173, 255, 0.35)'
      : '0 0 12px rgba(0, 255, 255, 0.35)'};
`;

const BubbleTimestamp = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.25rem;
  padding: 0 0.5rem;
`;

// Lista restauracji
const RestaurantsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const RestaurantItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(0, 255, 119, 0.5);
    transform: translateX(6px) scale(1.02);
    box-shadow: 0 4px 16px rgba(0, 255, 119, 0.2);
  }
  
  &:active {
    transform: translateX(3px) scale(0.98);
  }
`;

const RestaurantName = styled.div`
  color: #00ff77;
  font-weight: 600;
  font-size: clamp(14px, 2vw, 16px);
  margin-bottom: 0.25rem;
`;

const RestaurantCuisine = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(12px, 1.8vw, 14px);
  margin-bottom: 0.15rem;
`;

const RestaurantCity = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: clamp(11px, 1.6vw, 12px);
`;

// Lista pozycji menu
const MenuItemsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MenuItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(0, 255, 119, 0.5);
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 6px 20px rgba(0, 255, 119, 0.25);
  }
  
  &:active {
    transform: translateY(-2px) scale(0.98);
  }
`;

const MenuItemName = styled.div`
  color: #ffffff;
  font-weight: 500;
  font-size: clamp(13px, 1.9vw, 15px);
  margin-bottom: 0.35rem;
`;

const MenuItemPrice = styled.div`
  color: #00ff77;
  font-weight: 600;
  font-size: clamp(14px, 2vw, 16px);
  margin-bottom: 0.2rem;
`;

const MenuItemCategory = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: clamp(11px, 1.6vw, 12px);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

