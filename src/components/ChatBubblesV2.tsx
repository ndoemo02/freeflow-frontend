import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ResultCarouselV2 from './ResultCarouselV2';

interface ChatMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: number;
    restaurants?: any[];
    menuItems?: any[];
    locationRestaurants?: any[]; // Fallback
}

interface ChatBubblesV2Props {
    userMessage?: string;
    amberResponse?: string;
    restaurants?: Array<{ id: string; name: string; cuisine_type?: string; city?: string }>;
    menuItems?: Array<{ id: string; name: string; price_pln: number; category?: string }>;
    onRestaurantSelect?: (restaurant: any) => void;
    onMenuItemSelect?: (item: any) => void;
}

export default function ChatBubblesV2({
    userMessage,
    amberResponse,
    restaurants,
    menuItems,
    onRestaurantSelect,
    onMenuItemSelect
}: ChatBubblesV2Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<string | null>(null);

    useEffect(() => {
        // Handle User Message
        if (userMessage && userMessage !== lastMessageRef.current) {
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                text: userMessage,
                isUser: true,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, newMessage]);
            lastMessageRef.current = userMessage;
        }

        // Handle Amber Response
        if (amberResponse) {
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                const isUpdate = lastMsg && !lastMsg.isUser && lastMsg.text === amberResponse;

                // Check if we gained new data
                const hasNewData = (restaurants && restaurants.length > 0 && (!lastMsg?.restaurants || lastMsg.restaurants.length === 0)) ||
                    (menuItems && menuItems.length > 0 && (!lastMsg?.menuItems || lastMsg.menuItems.length === 0));

                if (isUpdate && !hasNewData) return prev;

                if (isUpdate && hasNewData) {
                    // Update existing message with new data
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        ...lastMsg,
                        restaurants: restaurants,
                        menuItems: menuItems,
                        locationRestaurants: restaurants
                    };
                    return updated;
                }

                // New message from Amber
                if (!isUpdate) {
                    return [...prev, {
                        id: Date.now().toString(),
                        text: amberResponse,
                        isUser: false,
                        timestamp: Date.now(),
                        restaurants: restaurants,
                        menuItems: menuItems,
                        locationRestaurants: restaurants
                    }];
                }
                return prev;
            });
        }
    }, [userMessage, amberResponse, restaurants, menuItems]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <Container>
            <AnimatePresence initial={false}>
                {messages.map((msg, index) => (
                    <MessageWrapper key={msg.id} $isUser={msg.isUser}>
                        <Bubble
                            $isUser={msg.isUser}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {msg.text}
                        </Bubble>

                        {/* Render Carousels if data exists */}
                        {!msg.isUser && (msg.restaurants || msg.locationRestaurants) && (msg.restaurants || msg.locationRestaurants)!.length > 0 && (
                            <CarouselContainer
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                <ResultCarouselV2
                                    items={msg.restaurants || msg.locationRestaurants || []}
                                    type="restaurant"
                                    onItemClick={onRestaurantSelect}
                                />
                            </CarouselContainer>
                        )}

                        {!msg.isUser && msg.menuItems && msg.menuItems.length > 0 && (
                            <CarouselContainer
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                <ResultCarouselV2
                                    items={msg.menuItems}
                                    type="menu"
                                    onItemClick={onMenuItemSelect}
                                />
                            </CarouselContainer>
                        )}
                    </MessageWrapper>
                ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </Container>
    );
}

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  padding-bottom: 120px; /* Space for VoiceCommandCenter */
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  overflow-y: auto;
  max-height: 80vh;
  
  /* Hide scrollbar */
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const MessageWrapper = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  width: 100%;
`;

const Bubble = styled(motion.div) <{ $isUser: boolean }>`
  max-width: 80%;
  padding: 15px 20px;
  border-radius: 20px;
  font-size: 1rem;
  line-height: 1.5;
  color: white;
  
  /* Glassmorphism */
  background: ${props => props.$isUser
        ? 'linear-gradient(135deg, rgba(0, 243, 255, 0.2), rgba(0, 100, 255, 0.2))'
        : 'rgba(20, 20, 30, 0.6)'};
  
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$isUser
        ? 'rgba(0, 243, 255, 0.3)'
        : 'rgba(255, 255, 255, 0.1)'};
    
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  
  ${props => props.$isUser ? `
    border-bottom-right-radius: 5px;
  ` : `
    border-bottom-left-radius: 5px;
  `}
`;

const CarouselContainer = styled(motion.div)`
  width: 100%;
  margin-top: 10px;
  overflow: hidden;
`;
