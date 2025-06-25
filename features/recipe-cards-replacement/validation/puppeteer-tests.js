/**
 * Puppeteer Validation Tests for Recipe Cards Replacement Feature
 * 
 * These tests validate that the hierarchical tree has been successfully 
 * replaced with a card-based recipe interface.
 */

const puppeteer = require('puppeteer');

class RecipeCardsValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:3000';
    this.results = [];
  }

  async setup() {
    console.log('🚀 Starting Puppeteer validation tests...');
    this.browser = await puppeteer.launch({ 
      headless: false, // Set to true for CI
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🏁 Puppeteer tests completed');
    this.printResults();
  }

  logResult(testName, passed, message = '') {
    const result = { testName, passed, message };
    this.results.push(result);
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));
    let passed = 0;
    let failed = 0;
    
    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}`);
      if (result.message) console.log(`   ${result.message}`);
      result.passed ? passed++ : failed++;
    });
    
    console.log('='.repeat(50));
    console.log(`Total: ${this.results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Success Rate: ${(passed / this.results.length * 100).toFixed(1)}%`);
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  async test01_InitialPageLoad() {
    console.log('\n🧪 Test 1: Initial Page Load and Empty State');
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Check for search bar
      const searchBarExists = await this.waitForElement('input[placeholder*="Search"]');
      this.logResult('Search Bar Present', searchBarExists, 'Search input field should be visible');
      
      // Check that hierarchical tree is NOT present
      const treeElementExists = await this.page.$('.hierarchical-tree, .tree-node, .virtual-scroll-tree');
      this.logResult('Hierarchical Tree Removed', !treeElementExists, 'No tree elements should exist');
      
      // Check for empty state elements
      const emptyStateExists = await this.waitForElement('.empty-search-state, .search-centric-layout');
      this.logResult('Empty State Displayed', emptyStateExists, 'Empty state should be shown initially');
      
      // Check app title
      const titleExists = await this.waitForElement('h1');
      const titleText = titleExists ? await this.page.$eval('h1', el => el.textContent) : '';
      this.logResult('App Title Present', titleText.includes('Recipe'), `Title: "${titleText}"`);
      
    } catch (error) {
      this.logResult('Initial Page Load', false, `Error: ${error.message}`);
    }
  }

  async test02_SearchFunctionality() {
    console.log('\n🧪 Test 2: Search Functionality and Card Display');
    
    try {
      // Enter search term
      const searchInput = await this.page.$('input[placeholder*="Search"]');
      if (!searchInput) {
        this.logResult('Search Input Found', false, 'Search input not found');
        return;
      }
      
      await searchInput.type('chicken', { delay: 100 });
      
      // Wait for search results
      await this.page.waitForTimeout(1000); // Debounce delay
      
      // Check for recipe cards (not tree nodes)
      const cardsExist = await this.waitForElement('.recipe-card', 5000);
      this.logResult('Recipe Cards Displayed', cardsExist, 'Recipe cards should appear after search');
      
      if (cardsExist) {
        // Count recipe cards
        const cardCount = await this.page.$$eval('.recipe-card', cards => cards.length);
        this.logResult('Multiple Cards Found', cardCount > 0, `Found ${cardCount} recipe cards`);
        
        // Check card structure
        const firstCard = await this.page.$('.recipe-card');
        if (firstCard) {
          const hasTitle = await firstCard.$('h3');
          const hasDescription = await firstCard.$('p');
          const hasMeta = await firstCard.$('.recipe-meta');
          
          this.logResult('Card Structure Valid', hasTitle && hasDescription && hasMeta, 
            'Cards should have title, description, and metadata');
        }
        
        // Check for grid layout (not tree layout)
        const gridExists = await this.page.$('.recipe-grid');
        this.logResult('Grid Layout Used', !!gridExists, 'Cards should be in grid layout');
      }
      
      // Verify no tree structure
      const noTreeNodes = !(await this.page.$('.tree-node, .hierarchical-tree'));
      this.logResult('No Tree Structure', noTreeNodes, 'Tree structure should be completely absent');
      
    } catch (error) {
      this.logResult('Search Functionality', false, `Error: ${error.message}`);
    }
  }

  async test03_RecipeCardClick() {
    console.log('\n🧪 Test 3: Recipe Card Click and Detail View');
    
    try {
      // Click first recipe card
      const firstCard = await this.page.$('.recipe-card');
      if (!firstCard) {
        this.logResult('Recipe Card Click', false, 'No recipe card found to click');
        return;
      }
      
      await firstCard.click();
      
      // Wait for detail view to open
      const detailViewExists = await this.waitForElement('.recipe-detail', 5000);
      this.logResult('Detail View Opens', detailViewExists, 'Recipe detail view should open on card click');
      
      if (detailViewExists) {
        // Check detail view content
        const hasIngredients = await this.waitForElement('.ingredients, .section h3');
        const hasInstructions = await this.waitForElement('.instructions');
        const hasBackButton = await this.waitForElement('.back-button, button');
        
        this.logResult('Detail Content Present', hasIngredients && hasInstructions, 
          'Detail view should show ingredients and instructions');
        this.logResult('Back Button Present', hasBackButton, 'Back button should be available');
        
        // Test back navigation
        if (hasBackButton) {
          const backButton = await this.page.$('.back-button, button');
          await backButton.click();
          
          // Wait for return to search results
          await this.page.waitForTimeout(500);
          const backToCards = await this.waitForElement('.recipe-card', 3000);
          this.logResult('Back Navigation Works', backToCards, 'Should return to card view');
        }
      }
      
    } catch (error) {
      this.logResult('Recipe Card Click', false, `Error: ${error.message}`);
    }
  }

  async test04_BrowseAllFunctionality() {
    console.log('\n🧪 Test 4: Browse All Functionality');
    
    try {
      // Clear search first
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Look for Browse All button
      const browseButton = await this.page.$('button[contains(text(), "Browse"), button[onclick*="browse"]');
      if (!browseButton) {
        // Try alternative selectors
        const buttons = await this.page.$$('button');
        let found = false;
        for (let button of buttons) {
          const text = await button.evaluate(el => el.textContent.toLowerCase());
          if (text.includes('browse')) {
            await button.click();
            found = true;
            break;
          }
        }
        this.logResult('Browse Button Found', found, 'Browse All button should be available');
        if (!found) return;
      } else {
        await browseButton.click();
      }
      
      // Wait for all recipes to load
      await this.page.waitForTimeout(2000);
      
      // Check for recipe cards without search
      const cardsExist = await this.waitForElement('.recipe-card', 5000);
      this.logResult('Browse Shows Cards', cardsExist, 'Browse all should show recipe cards');
      
      if (cardsExist) {
        const cardCount = await this.page.$$eval('.recipe-card', cards => cards.length);
        this.logResult('Multiple Recipes Browsable', cardCount > 1, `Browse shows ${cardCount} recipes`);
      }
      
    } catch (error) {
      this.logResult('Browse All Functionality', false, `Error: ${error.message}`);
    }
  }

  async test05_ResponsiveDesign() {
    console.log('\n🧪 Test 5: Responsive Design');
    
    try {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 }); // iPhone SE
      await this.page.reload({ waitUntil: 'networkidle2' });
      
      // Search for recipes
      const searchInput = await this.page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.type('pasta');
        await this.page.waitForTimeout(1000);
      }
      
      // Check if cards adapt to mobile
      const cardsExist = await this.waitForElement('.recipe-card', 5000);
      if (cardsExist) {
        const gridStyle = await this.page.$eval('.recipe-grid', el => 
          window.getComputedStyle(el).getPropertyValue('grid-template-columns')
        );
        
        // On mobile, should be single column or very narrow columns
        const isMobileFriendly = gridStyle.includes('1fr') || gridStyle.includes('100%');
        this.logResult('Mobile Layout Adapted', isMobileFriendly, `Grid columns: ${gridStyle}`);
      }
      
      // Test tablet viewport
      await this.page.setViewport({ width: 768, height: 1024 }); // iPad
      await this.page.waitForTimeout(500);
      
      const tabletLayout = await this.page.$('.recipe-grid');
      this.logResult('Tablet Layout Responsive', !!tabletLayout, 'Layout should adapt to tablet size');
      
      // Return to desktop
      await this.page.setViewport({ width: 1280, height: 720 });
      
    } catch (error) {
      this.logResult('Responsive Design', false, `Error: ${error.message}`);
    }
  }

  async test06_PerformanceValidation() {
    console.log('\n🧪 Test 6: Performance Validation');
    
    try {
      const startTime = Date.now();
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      this.logResult('Page Load Performance', loadTime < 5000, `Load time: ${loadTime}ms`);
      
      // Test search performance
      const searchStart = Date.now();
      const searchInput = await this.page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.type('test');
        await this.waitForElement('.recipe-card, .recipe-grid-empty', 3000);
        const searchTime = Date.now() - searchStart;
        this.logResult('Search Performance', searchTime < 2000, `Search time: ${searchTime}ms`);
      }
      
    } catch (error) {
      this.logResult('Performance Validation', false, `Error: ${error.message}`);
    }
  }

  async runAllTests() {
    await this.setup();
    
    try {
      await this.test01_InitialPageLoad();
      await this.test02_SearchFunctionality();
      await this.test03_RecipeCardClick();
      await this.test04_BrowseAllFunctionality();
      await this.test05_ResponsiveDesign();
      await this.test06_PerformanceValidation();
    } catch (error) {
      console.error('❌ Test suite error:', error);
    }
    
    await this.teardown();
  }
}

// Export for use in other test files
module.exports = RecipeCardsValidator;

// Run tests if this file is executed directly
if (require.main === module) {
  const validator = new RecipeCardsValidator();
  validator.runAllTests().catch(console.error);
}