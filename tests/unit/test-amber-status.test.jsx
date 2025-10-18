/**
 * Testy jednostkowe dla AmberStatus komponentu
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AmberStatus from '../../src/components/AmberStatus';

describe('AmberStatus Component', () => {
  it('should render with default ready state', () => {
    render(<AmberStatus />);
    
    const statusIndicator = screen.getByTitle('Ready');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('w-3', 'h-3', 'rounded-full', 'bg-green-500');
  });

  it('should render thinking state correctly', () => {
    render(<AmberStatus state="thinking" />);
    
    const statusIndicator = screen.getByTitle('Thinking');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('bg-yellow-500', 'animate-pulse');
  });

  it('should render error state correctly', () => {
    render(<AmberStatus state="error" />);
    
    const statusIndicator = screen.getByTitle('Error');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('bg-red-500');
  });

  it('should render idle state correctly', () => {
    render(<AmberStatus state="idle" />);
    
    const statusIndicator = screen.getByTitle('Idle');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('bg-gray-500');
  });

  it('should have proper accessibility attributes', () => {
    render(<AmberStatus state="thinking" />);
    
    const statusIndicator = screen.getByTitle('Thinking');
    expect(statusIndicator).toHaveAttribute('title', 'Thinking');
  });

  it('should handle invalid state gracefully', () => {
    render(<AmberStatus state="invalid" />);
    
    // Should fallback to default ready state
    const statusIndicator = screen.getByTitle('Ready');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('bg-green-500');
  });

  it('should have consistent size and shape', () => {
    const { rerender } = render(<AmberStatus state="ready" />);
    
    const getStatusIndicator = () => screen.getByRole('img', { hidden: true });
    
    // Test all states have same size classes
    const states = ['ready', 'thinking', 'error', 'idle'];
    
    states.forEach(state => {
      rerender(<AmberStatus state={state} />);
      const indicator = getStatusIndicator();
      expect(indicator).toHaveClass('w-3', 'h-3', 'rounded-full');
    });
  });
});

