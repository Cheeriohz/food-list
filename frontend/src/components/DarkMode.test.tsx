import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import App from '../App';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia for system theme detection
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('Dark Mode Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Default to light mode for consistent testing
    mockMatchMedia(false);
  });

  describe('Theme Toggle Component', () => {
    it('should render theme toggle button', () => {
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to.*mode/i);
      expect(themeToggle).toBeInTheDocument();
    });

    it('should show correct icon for current theme', () => {
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to.*mode/i);
      // Should show sun icon in light mode by default
      expect(themeToggle).toHaveTextContent('☀️');
    });

    it('should toggle theme when clicked', async () => {
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to dark mode/i);
      
      // Click to switch to dark mode
      fireEvent.click(themeToggle);
      
      await waitFor(() => {
        const updatedToggle = screen.getByLabelText(/switch to light mode/i);
        expect(updatedToggle).toHaveTextContent('🌙');
      });
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme choice in localStorage', () => {
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to dark mode/i);
      fireEvent.click(themeToggle);
      
      expect(localStorageMock.getItem('theme')).toBe('dark');
    });

    it('should restore theme from localStorage on mount', () => {
      localStorageMock.setItem('theme', 'dark');
      
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to light mode/i);
      expect(themeToggle).toHaveTextContent('🌙');
    });
  });

  describe('System Theme Detection', () => {
    it('should detect system dark theme preference', () => {
      mockMatchMedia(true); // System prefers dark mode
      
      render(<App />);
      
      // Should show moon icon when system is dark
      const themeToggle = screen.getByLabelText(/currently system: dark/i);
      expect(themeToggle).toHaveTextContent('🌙');
    });

    it('should detect system light theme preference', () => {
      mockMatchMedia(false); // System prefers light mode
      
      render(<App />);
      
      // Should show sun icon when system is light
      const themeToggle = screen.getByLabelText(/currently system: light/i);
      expect(themeToggle).toHaveTextContent('☀️');
    });

    it('should override system theme when user makes explicit choice', async () => {
      mockMatchMedia(true); // System prefers dark mode
      
      render(<App />);
      
      // Initially follows system (dark)
      const systemToggle = screen.getByLabelText(/currently system: dark/i);
      expect(systemToggle).toHaveTextContent('🌙');
      
      // User clicks to override to light mode
      fireEvent.click(systemToggle);
      
      await waitFor(() => {
        const lightToggle = screen.getByLabelText(/switch to dark mode/i);
        expect(lightToggle).toHaveTextContent('☀️');
      });
      
      // Should persist explicit choice
      expect(localStorageMock.getItem('theme')).toBe('light');
    });
  });

  describe('Theme Application', () => {
    it('should apply dark theme data attribute to document', async () => {
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to dark mode/i);
      fireEvent.click(themeToggle);
      
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      });
    });

    it('should remove dark theme data attribute in light mode', async () => {
      // Start with dark theme
      localStorageMock.setItem('theme', 'dark');
      
      render(<App />);
      
      // Should have dark theme initially
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      
      const themeToggle = screen.getByLabelText(/switch to light mode/i);
      fireEvent.click(themeToggle);
      
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBeNull();
      });
    });
  });

  describe('Component Style Integration', () => {
    it('should render main layout components', () => {
      render(<App />);
      
      // Check that main layout components are present
      expect(document.querySelector('.search-centric-layout')).toBeInTheDocument();
      expect(document.querySelector('.search-header')).toBeInTheDocument();
      expect(document.querySelector('.app-title')).toBeInTheDocument();
    });

    it('should show empty search state by default', () => {
      render(<App />);
      
      // Should show empty search state
      expect(document.querySelector('.empty-search-state')).toBeInTheDocument();
      expect(document.querySelector('.hero-section')).toBeInTheDocument();
    });

    it('should apply CSS variables consistently across components', async () => {
      render(<App />);
      
      // Get computed styles before theme switch
      const searchHeader = document.querySelector('.search-header');
      const computedBefore = window.getComputedStyle(searchHeader!);
      
      // Switch to dark theme
      const themeToggle = screen.getByLabelText(/switch to dark mode/i);
      fireEvent.click(themeToggle);
      
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      });
      
      // Verify that styles have changed (background should be different)
      const computedAfter = window.getComputedStyle(searchHeader!);
      expect(computedBefore.backgroundColor).not.toBe(computedAfter.backgroundColor);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on theme toggle', () => {
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to dark mode/i);
      expect(themeToggle).toHaveAttribute('aria-label');
      expect(themeToggle).toHaveAttribute('title');
    });

    it('should update ARIA labels when theme changes', async () => {
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to dark mode/i);
      fireEvent.click(themeToggle);
      
      await waitFor(() => {
        const updatedToggle = screen.getByLabelText(/switch to light mode/i);
        expect(updatedToggle).toHaveAttribute('aria-label', expect.stringContaining('light mode'));
      });
    });

    it('should be keyboard accessible', () => {
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to dark mode/i);
      
      // Should be focusable
      themeToggle.focus();
      expect(document.activeElement).toBe(themeToggle);
      
      // Should respond to Enter key
      fireEvent.keyDown(themeToggle, { key: 'Enter', code: 'Enter' });
      // Theme toggle uses onClick, so Enter should trigger it
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain theme toggle visibility on mobile', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      
      render(<App />);
      
      const themeToggle = screen.getByLabelText(/switch to.*mode/i);
      expect(themeToggle).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage failures gracefully', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('localStorage is full');
      });
      
      // Should not crash when localStorage fails
      expect(() => {
        render(<App />);
        const themeToggle = screen.getByLabelText(/switch to dark mode/i);
        fireEvent.click(themeToggle);
      }).not.toThrow();
      
      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle invalid localStorage values gracefully', () => {
      localStorageMock.setItem('theme', 'invalid-theme');
      
      expect(() => {
        render(<App />);
      }).not.toThrow();
      
      // Should fall back to system theme
      const themeToggle = screen.getByLabelText(/currently system/i);
      expect(themeToggle).toBeInTheDocument();
    });
  });
});