import { useState, useEffect } from 'react';

/**
 * Custom hook to simulate a typing effect for a given string.
 * @param textToType The full text that should be typed out.
 * @param speed The delay in milliseconds between each character.
 * @returns The currently typed out portion of the string.
 */
export const useTypingEffect = (textToType: string, speed: number = 50) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText(''); // Reset on new text

    if (!textToType) return;

    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(prev => prev + textToType.charAt(i));
      i++;
      if (i >= textToType.length) {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [textToType, speed]);

  return displayedText;
};