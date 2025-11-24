import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

interface ResultCarouselProps {
    items: any[];
    type: 'restaurant' | 'menu';
    onItemClick?: (item: any) => void;
}

export default function ResultCarousel({ items, type, onItemClick }: ResultCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!items || items.length === 0) return null;

    return (
        <CarouselContainer
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
        >
            <ScrollTrack ref={scrollRef}>
                {items.map((item, index) => (
                    <CardWrapper
                        key={item.id || index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        onClick={() => onItemClick?.(item)}
                    >
                        <GlassCard $type={type}>
                            {type === 'restaurant' ? (
                                <>
                                    <CardIcon>🍽️</CardIcon>
                                    <CardContent>
                                        <CardTitle>{item.name}</CardTitle>
                                        <CardSubtitle>{item.cuisine_type || 'Restauracja'}</CardSubtitle>
                                        <CardMeta>{item.city || 'W pobliżu'}</CardMeta>
                                    </CardContent>
                                </>
                            ) : (
                                <>
                                    <CardIcon>🍕</CardIcon>
                                    <CardContent>
                                        <CardTitle>{item.name}</CardTitle>
                                        <CardPrice>{Number(item.price_pln).toFixed(2)} zł</CardPrice>
                                        <CardMeta>{item.category || 'Danie'}</CardMeta>
                                    </CardContent>
                                </>
                            )}
                        </GlassCard>
                    </CardWrapper>
                ))}
            </ScrollTrack>
        </CarouselContainer>
    );
}

// Styled Components

const CarouselContainer = styled(motion.div)`
  width: 100%;
  margin-top: 12px;
  overflow: hidden;
  /* Ensure it doesn't break layout */
  position: relative;
  z-index: 10;
`;

const ScrollTrack = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 4px 16px 4px; /* Bottom padding for shadow/hover space */
  scroll-snap-type: x mandatory;
  
  /* Hide scrollbar */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Mask fade on edges */
  mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
`;

const CardWrapper = styled(motion.div)`
  flex: 0 0 auto;
  scroll-snap-align: center;
  width: 200px;
  cursor: pointer;
`;

const GlassCard = styled.div<{ $type: 'restaurant' | 'menu' }>`
  background: rgba(20, 20, 30, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px;
  height: 100%;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  
  border: 1px solid ${props => props.$type === 'restaurant'
        ? 'rgba(0, 240, 255, 0.15)'
        : 'rgba(255, 0, 170, 0.15)'};
    
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    background: rgba(30, 30, 45, 0.7);
    border-color: ${props => props.$type === 'restaurant'
        ? 'rgba(0, 240, 255, 0.4)'
        : 'rgba(255, 0, 170, 0.4)'};
    box-shadow: ${props => props.$type === 'restaurant'
        ? '0 8px 25px rgba(0, 240, 255, 0.15)'
        : '0 8px 25px rgba(255, 0, 170, 0.15)'};
  }
`;

const CardIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
  filter: drop-shadow(0 0 8px rgba(255,255,255,0.3));
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const CardTitle = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.3;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardSubtitle = styled.div`
  color: rgba(0, 240, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
`;

const CardPrice = styled.div`
  color: #ff00aa;
  font-weight: 600;
  font-size: 14px;
`;

const CardMeta = styled.div`
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  margin-top: 2px;
`;
