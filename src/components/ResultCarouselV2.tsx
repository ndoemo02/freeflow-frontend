import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface ResultCarouselV2Props {
    items: any[];
    type: 'restaurant' | 'menu';
    onItemClick?: (item: any) => void;
}

export default function ResultCarouselV2({ items, type, onItemClick }: ResultCarouselV2Props) {
    if (!items || items.length === 0) return null;

    return (
        <CarouselContainer>
            <ScrollTrack>
                {items.map((item, index) => (
                    <HoloCard
                        key={item.id || index}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onItemClick && onItemClick(item)}
                    >
                        <CardGlow />
                        <CardContent>
                            {type === 'restaurant' ? (
                                <>
                                    <IconWrapper>🍽️</IconWrapper>
                                    <Title>{item.name}</Title>
                                    <Subtitle>{item.cuisine_type || 'Restauracja'}</Subtitle>
                                    <Detail>{item.city || 'Piekary Śląskie'}</Detail>
                                </>
                            ) : (
                                <>
                                    <IconWrapper>🍕</IconWrapper>
                                    <Title>{item.name}</Title>
                                    <Price>{item.price_pln ? `${item.price_pln} zł` : ''}</Price>
                                    <Detail>{item.category || 'Danie'}</Detail>
                                </>
                            )}
                        </CardContent>
                    </HoloCard>
                ))}
            </ScrollTrack>
        </CarouselContainer>
    );
}

// Styled Components
const CarouselContainer = styled.div`
  width: 100%;
  padding: 20px 0;
  overflow-x: auto;
  
  /* Hide scrollbar */
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const ScrollTrack = styled.div`
  display: flex;
  gap: 20px;
  padding: 0 10px;
  width: max-content;
`;

const HoloCard = styled(motion.div)`
  position: relative;
  width: 200px;
  height: 240px;
  background: rgba(20, 20, 30, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  
  /* Holographic Border Effect */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    padding: 2px;
    background: linear-gradient(135deg, transparent, rgba(0, 243, 255, 0.5), transparent);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const CardGlow = styled.div`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(0, 243, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  
  ${HoloCard}:hover & {
    opacity: 1;
  }
`;

const CardContent = styled.div`
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const IconWrapper = styled.div`
  font-size: 2.5rem;
  margin-bottom: 10px;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
`;

const Title = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.2;
`;

const Subtitle = styled.span`
  font-size: 0.9rem;
  color: var(--neon-primary, #00f3ff);
  font-weight: 500;
`;

const Price = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--neon-secondary, #bc13fe);
  text-shadow: 0 0 10px rgba(188, 19, 254, 0.3);
`;

const Detail = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`;
