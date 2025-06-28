/**
 * Accessibility validation utility for dark mode implementation
 * Validates WCAG AA compliance for color contrast ratios
 */

interface ColorContrastResult {
  ratio: number;
  isCompliant: boolean;
  level: 'AAA' | 'AA' | 'FAIL';
}

interface AccessibilityTestResult {
  element: string;
  light: ColorContrastResult;
  dark: ColorContrastResult;
  issues: string[];
}

export class AccessibilityValidator {
  
  /**
   * Calculate luminance of a color (sRGB)
   */
  private getLuminance(r: number, g: number, b: number): number {
    const normalize = (c: number) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    
    return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
  }
  
  /**
   * Parse RGB color string to individual values
   */
  private parseColor(color: string): { r: number; g: number; b: number } | null {
    // Handle rgb() format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }
    
    // Handle rgba() format
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1]),
        g: parseInt(rgbaMatch[2]),
        b: parseInt(rgbaMatch[3])
      };
    }
    
    // Handle hex format
    const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    }
    
    return null;
  }
  
  /**
   * Calculate contrast ratio between two colors
   */
  public calculateContrastRatio(foreground: string, background: string): number {
    const fg = this.parseColor(foreground);
    const bg = this.parseColor(background);
    
    if (!fg || !bg) {
      console.warn('Could not parse colors:', { foreground, background });
      return 0;
    }
    
    const fgLuminance = this.getLuminance(fg.r, fg.g, fg.b);
    const bgLuminance = this.getLuminance(bg.r, bg.g, bg.b);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  /**
   * Evaluate contrast ratio compliance
   */
  public evaluateContrast(ratio: number, isLargeText: boolean = false): ColorContrastResult {
    const aaThreshold = isLargeText ? 3.0 : 4.5;
    const aaaThreshold = isLargeText ? 4.5 : 7.0;
    
    return {
      ratio,
      isCompliant: ratio >= aaThreshold,
      level: ratio >= aaaThreshold ? 'AAA' : ratio >= aaThreshold ? 'AA' : 'FAIL'
    };
  }
  
  /**
   * Test accessibility for a specific element
   */
  public testElement(selector: string, isLargeText: boolean = false): AccessibilityTestResult | null {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
      return null;
    }
    
    const issues: string[] = [];
    
    // Test light theme
    document.documentElement.removeAttribute('data-theme');
    const lightStyles = window.getComputedStyle(element);
    const lightFg = lightStyles.color;
    const lightBg = lightStyles.backgroundColor;
    
    // Test dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
    const darkStyles = window.getComputedStyle(element);
    const darkFg = darkStyles.color;
    const darkBg = darkStyles.backgroundColor;
    
    // Calculate contrast ratios
    const lightRatio = this.calculateContrastRatio(lightFg, lightBg);
    const darkRatio = this.calculateContrastRatio(darkFg, darkBg);
    
    const lightResult = this.evaluateContrast(lightRatio, isLargeText);
    const darkResult = this.evaluateContrast(darkRatio, isLargeText);
    
    // Check for issues
    if (!lightResult.isCompliant) {
      issues.push(`Light theme contrast ratio (${lightRatio.toFixed(2)}) fails WCAG AA`);
    }
    
    if (!darkResult.isCompliant) {
      issues.push(`Dark theme contrast ratio (${darkRatio.toFixed(2)}) fails WCAG AA`);
    }
    
    // Check if element has proper ARIA attributes
    if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label') && !element.textContent?.trim()) {
      issues.push('Button missing accessible name (aria-label or text content)');
    }
    
    return {
      element: selector,
      light: lightResult,
      dark: darkResult,
      issues
    };
  }
  
  /**
   * Run comprehensive accessibility tests
   */
  public runFullAccessibilityAudit(): AccessibilityTestResult[] {
    console.log('🔍 Starting accessibility audit...');
    
    const testCases = [
      // Text elements
      { selector: '.app-title', isLargeText: true },
      { selector: '.hero-title', isLargeText: true },
      { selector: '.hero-description', isLargeText: false },
      { selector: '.search-stats', isLargeText: false },
      { selector: '.keyboard-hint', isLargeText: false },
      
      // Interactive elements
      { selector: '.theme-toggle', isLargeText: false },
      { selector: '.primary-action-button', isLargeText: false },
      { selector: '.secondary-action-button', isLargeText: false },
      { selector: '.back-button', isLargeText: false },
      
      // Form elements (if present)
      { selector: 'input', isLargeText: false },
      { selector: 'button', isLargeText: false },
    ];
    
    const results: AccessibilityTestResult[] = [];
    
    testCases.forEach(({ selector, isLargeText }) => {
      const result = this.testElement(selector, isLargeText);
      if (result) {
        results.push(result);
      }
    });
    
    // Generate summary
    const totalTests = results.length;
    const passedLight = results.filter(r => r.light.isCompliant).length;
    const passedDark = results.filter(r => r.dark.isCompliant).length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    
    console.log('📊 Accessibility Audit Results:');
    console.log(`   Light theme: ${passedLight}/${totalTests} elements compliant`);
    console.log(`   Dark theme: ${passedDark}/${totalTests} elements compliant`);
    console.log(`   Total issues found: ${totalIssues}`);
    
    if (totalIssues > 0) {
      console.log('⚠️ Issues found:');
      results.forEach(result => {
        if (result.issues.length > 0) {
          console.log(`   ${result.element}:`);
          result.issues.forEach(issue => console.log(`     - ${issue}`));
        }
      });
    } else {
      console.log('✅ All tests passed!');
    }
    
    return results;
  }
  
  /**
   * Test keyboard navigation
   */
  public testKeyboardNavigation(): string[] {
    console.log('⌨️ Testing keyboard navigation...');
    
    const issues: string[] = [];
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) {
      issues.push('No focusable elements found');
      return issues;
    }
    
    // Test focus indicators
    focusableElements.forEach((element, index) => {
      if (element instanceof HTMLElement) {
        element.focus();
        const styles = window.getComputedStyle(element);
        
        // Check for focus indicators
        const hasOutline = styles.outline !== 'none' && styles.outline !== '0px';
        const hasBoxShadow = styles.boxShadow !== 'none';
        const hasBorder = styles.borderStyle !== 'none';
        
        if (!hasOutline && !hasBoxShadow && !hasBorder) {
          issues.push(`Element ${element.tagName} (#${index}) lacks visible focus indicator`);
        }
      }
    });
    
    // Test tab order
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle instanceof HTMLElement) {
      const tabIndex = themeToggle.tabIndex;
      if (tabIndex < 0) {
        issues.push('Theme toggle is not keyboard accessible (tabIndex < 0)');
      }
    }
    
    console.log(`   Tested ${focusableElements.length} focusable elements`);
    console.log(`   Found ${issues.length} keyboard navigation issues`);
    
    return issues;
  }
  
  /**
   * Test motion preferences
   */
  public testMotionPreferences(): string[] {
    console.log('🎬 Testing motion preferences...');
    
    const issues: string[] = [];
    
    // Create a test element with animation
    const testElement = document.createElement('div');
    testElement.style.transition = 'all 0.3s ease';
    testElement.style.animation = 'fadeIn 0.5s ease';
    document.body.appendChild(testElement);
    
    // Simulate prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      const styles = window.getComputedStyle(testElement);
      if (styles.transition !== 'none' || styles.animation !== 'none') {
        issues.push('Animations not disabled for users who prefer reduced motion');
      }
    }
    
    // Clean up
    document.body.removeChild(testElement);
    
    console.log(`   Motion preferences test completed`);
    console.log(`   Found ${issues.length} motion-related issues`);
    
    return issues;
  }
}

// Make available globally for manual testing
if (typeof window !== 'undefined') {
  (window as any).AccessibilityValidator = AccessibilityValidator;
  (window as any).accessibilityValidator = new AccessibilityValidator();
}