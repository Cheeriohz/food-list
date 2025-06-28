/**
 * Manual test utility for verifying theme persistence
 * Run this in the browser console to verify theme persistence
 */

export const manualThemeTests = {
  testThemePersistence: () => {
    console.log('🧪 Testing Theme Persistence...');
    
    // 1. Check initial theme state
    const initialTheme = localStorage.getItem('theme');
    console.log('📋 Initial theme from localStorage:', initialTheme);
    
    // 2. Check current applied theme
    const currentDataTheme = document.documentElement.getAttribute('data-theme');
    console.log('📋 Current data-theme attribute:', currentDataTheme);
    
    // 3. Test setting different themes
    console.log('⚡ Testing theme switching...');
    
    const themes = ['light', 'dark', 'system'];
    themes.forEach((theme, index) => {
      setTimeout(() => {
        localStorage.setItem('theme', theme);
        console.log(`✅ Set theme to: ${theme}`);
        
        // Simulate page reload by dispatching storage event
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'theme',
          newValue: theme,
          oldValue: localStorage.getItem('theme'),
          storageArea: localStorage
        }));
        
        setTimeout(() => {
          const newDataTheme = document.documentElement.getAttribute('data-theme');
          console.log(`📋 After setting ${theme}, data-theme is:`, newDataTheme);
        }, 100);
      }, index * 1000);
    });
    
    return 'Theme persistence test started. Check console for results.';
  },
  
  testSystemThemeDetection: () => {
    console.log('🧪 Testing System Theme Detection...');
    
    // Check if browser supports system theme detection
    const supportsMatchMedia = window.matchMedia !== undefined;
    console.log('📋 Browser supports matchMedia:', supportsMatchMedia);
    
    if (supportsMatchMedia) {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('📋 System prefers dark mode:', systemPrefersDark);
      
      // Test system theme
      localStorage.setItem('theme', 'system');
      console.log('✅ Set theme to system');
      
      setTimeout(() => {
        const dataTheme = document.documentElement.getAttribute('data-theme');
        console.log('📋 With system theme, data-theme is:', dataTheme);
        console.log('📋 This should match system preference:', systemPrefersDark ? 'dark' : 'light');
      }, 100);
    }
    
    return 'System theme detection test started. Check console for results.';
  },
  
  testResponsiveThemeToggle: () => {
    console.log('🧪 Testing Responsive Theme Toggle...');
    
    const themeToggle = document.querySelector('[aria-label*="Switch to"]') as HTMLElement;
    
    if (!themeToggle) {
      console.error('❌ Theme toggle button not found');
      return 'Theme toggle not found';
    }
    
    console.log('✅ Theme toggle found');
    
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' }
    ];
    
    viewports.forEach((viewport, index) => {
      setTimeout(() => {
        // Simulate viewport resize
        window.innerWidth = viewport.width;
        window.innerHeight = viewport.height;
        window.dispatchEvent(new Event('resize'));
        
        console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        setTimeout(() => {
          const toggleVisible = themeToggle.offsetParent !== null;
          const toggleStyles = window.getComputedStyle(themeToggle);
          
          console.log(`📋 ${viewport.name} - Toggle visible:`, toggleVisible);
          console.log(`📋 ${viewport.name} - Toggle display:`, toggleStyles.display);
          console.log(`📋 ${viewport.name} - Toggle visibility:`, toggleStyles.visibility);
        }, 100);
      }, index * 1000);
    });
    
    return 'Responsive theme toggle test started. Check console for results.';
  },
  
  testColorContrast: () => {
    console.log('🧪 Testing Color Contrast...');
    
    const testElements = [
      '.app-title',
      '.hero-description', 
      '.search-stats',
      '.keyboard-hint',
      'button'
    ];
    
    testElements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const styles = window.getComputedStyle(element);
        console.log(`📋 ${selector}:`);
        console.log(`   Color: ${styles.color}`);
        console.log(`   Background: ${styles.backgroundColor}`);
      }
    });
    
    return 'Color contrast logged to console. Check values against WCAG guidelines.';
  },
  
  runAllTests: () => {
    console.log('🚀 Running all manual theme tests...');
    manualThemeTests.testThemePersistence();
    setTimeout(() => manualThemeTests.testSystemThemeDetection(), 4000);
    setTimeout(() => manualThemeTests.testResponsiveThemeToggle(), 6000);
    setTimeout(() => manualThemeTests.testColorContrast(), 10000);
    return 'All tests started. Check console for results over the next 15 seconds.';
  }
};

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).manualThemeTests = manualThemeTests;
}