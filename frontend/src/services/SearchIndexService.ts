interface PostingList {
  termFrequency: Map<number, number>; // document_id -> frequency
  documentFrequency: number; // total docs containing term
  positions: Map<number, number[]>; // document_id -> [positions]
}

interface SearchIndex {
  invertedIndex: Map<string, PostingList>;
  ngramIndex: Map<string, Set<number>>;
  documentIndex: Map<number, IndexedDocument>;
  totalDocuments: number;
}

interface IndexedDocument {
  id: number;
  type: 'recipe' | 'tag';
  title: string;
  content: string;
  tokens: string[];
  length: number; // Total token count
  fields: {
    title: string;
    description?: string;
    ingredients?: string;
    tags?: string;
  };
}

import { Recipe, Tag } from '../types';

interface TokenInfo {
  token: string;
  weight: number;
  positions: number[];
  field: 'title' | 'description' | 'ingredients' | 'tags';
}

interface SearchResult {
  id: number;
  type: 'recipe' | 'tag';
  score: number;
  matchType: 'exact' | 'prefix' | 'fuzzy';
  highlights: { field: string; positions: number[] }[];
}

class SearchIndexService {
  private index: SearchIndex;
  private stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'throughout', 'a', 'an', 'as', 'is',
    'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
    'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'can', 'shall'
  ]);

  constructor() {
    this.index = {
      invertedIndex: new Map(),
      ngramIndex: new Map(),
      documentIndex: new Map(),
      totalDocuments: 0
    };
  }

  /**
   * Build search index from recipes and tags
   */
  async buildIndex(recipes: Recipe[], tags: Tag[]): Promise<void> {
    console.time('Search Index Build');
    
    // Clear existing index
    this.clearIndex();
    
    // Process recipes in chunks to avoid UI blocking
    const CHUNK_SIZE = 1000;
    const totalRecipes = recipes.length;
    const totalChunks = Math.ceil(totalRecipes / CHUNK_SIZE);
    
    // Index recipes
    for (let i = 0; i < totalChunks; i++) {
      const chunk = recipes.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await this.processRecipeChunk(chunk);
      
      // Yield control every 10 chunks to prevent UI blocking
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Index tags (usually smaller dataset)
    await this.processTagChunk(tags);
    
    // Optimize index after building
    this.optimizeIndex();
    
    console.timeEnd('Search Index Build');
    console.log(`Indexed ${this.index.totalDocuments} documents with ${this.index.invertedIndex.size} unique terms`);
  }

  /**
   * Search with multi-stage pipeline
   */
  async search(query: string, maxResults: number = 100): Promise<SearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }
    
    const startTime = performance.now();
    
    // Stage 1: Exact matches (fastest)
    const exactMatches = await this.exactMatchSearch(query);
    
    if (exactMatches.length >= maxResults) {
      this.logSearchPerformance(query, performance.now() - startTime, exactMatches.length);
      return exactMatches.slice(0, maxResults);
    }
    
    // Stage 2: Prefix matches
    const prefixMatches = await this.prefixMatchSearch(query);
    const combined = this.mergeAndDeduplicateResults(exactMatches, prefixMatches);
    
    if (combined.length >= maxResults) {
      this.logSearchPerformance(query, performance.now() - startTime, combined.length);
      return combined.slice(0, maxResults);
    }
    
    // Stage 3: Fuzzy matches (n-grams)
    const fuzzyMatches = await this.fuzzyMatchSearch(query);
    const final = this.mergeAndDeduplicateResults(combined, fuzzyMatches);
    
    const endTime = performance.now();
    this.logSearchPerformance(query, endTime - startTime, final.length);
    
    return final.slice(0, maxResults);
  }

  /**
   * Get search suggestions for autocomplete
   */
  getSuggestions(partialQuery: string, maxSuggestions: number = 5): string[] {
    const query = partialQuery.toLowerCase().trim();
    if (query.length < 2) return [];
    
    const suggestions = new Set<string>();
    
    // Find terms that start with the query
    for (const term of this.index.invertedIndex.keys()) {
      if (term.startsWith(query) && !this.stopWords.has(term)) {
        suggestions.add(term);
        if (suggestions.size >= maxSuggestions) break;
      }
    }
    
    return Array.from(suggestions).sort();
  }

  /**
   * Process recipe chunk for indexing
   */
  private async processRecipeChunk(recipes: Recipe[]): Promise<void> {
    recipes.forEach(recipe => {
      if (!recipe.id) return;
      
      const indexedDoc: IndexedDocument = {
        id: recipe.id,
        type: 'recipe',
        title: recipe.title,
        content: this.buildRecipeContent(recipe),
        tokens: [],
        length: 0,
        fields: {
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          tags: recipe.tags?.map((t: Tag) => t.name).join(' ') || ''
        }
      };
      
      const tokens = this.tokenizeDocument(indexedDoc);
      indexedDoc.tokens = tokens.map(t => t.token);
      indexedDoc.length = tokens.length;
      
      this.addDocumentToIndex(indexedDoc, tokens);
    });
  }

  /**
   * Process tag chunk for indexing
   */
  private async processTagChunk(tags: Tag[]): Promise<void> {
    tags.forEach(tag => {
      if (!tag.id) return;
      
      const indexedDoc: IndexedDocument = {
        id: tag.id,
        type: 'tag',
        title: tag.name,
        content: tag.name,
        tokens: [],
        length: 0,
        fields: {
          title: tag.name
        }
      };
      
      const tokens = this.tokenizeDocument(indexedDoc);
      indexedDoc.tokens = tokens.map(t => t.token);
      indexedDoc.length = tokens.length;
      
      this.addDocumentToIndex(indexedDoc, tokens);
    });
  }

  /**
   * Advanced tokenization with field weighting
   */
  private tokenizeDocument(doc: IndexedDocument): TokenInfo[] {
    const tokens: TokenInfo[] = [];
    
    // Field weights for relevance scoring
    const fields = [
      { content: doc.fields.title, weight: 3.0, field: 'title' as const },
      { content: doc.fields.tags || '', weight: 2.5, field: 'tags' as const },
      { content: doc.fields.ingredients || '', weight: 2.0, field: 'ingredients' as const },
      { content: doc.fields.description || '', weight: 1.5, field: 'description' as const }
    ];
    
    fields.forEach(({ content, weight, field }) => {
      if (!content) return;
      
      const fieldTokens = this.tokenizeField(content, weight, field);
      tokens.push(...fieldTokens);
    });
    
    return tokens;
  }

  /**
   * Tokenize individual field
   */
  private tokenizeField(content: string, weight: number, field: TokenInfo['field']): TokenInfo[] {
    const tokens: TokenInfo[] = [];
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    
    words.forEach((word, index) => {
      if (this.stopWords.has(word) || word.length < 3) return;
      
      // Original word
      tokens.push({
        token: word,
        weight,
        positions: [index],
        field
      });
      
      // Generate n-grams for fuzzy matching
      if (word.length >= 4) {
        for (let i = 0; i <= word.length - 3; i++) {
          const ngram = word.substring(i, i + 3);
          tokens.push({
            token: `#${ngram}#`, // Mark as n-gram
            weight: weight * 0.5,
            positions: [index],
            field
          });
        }
      }
    });
    
    return tokens;
  }

  /**
   * Add document and its tokens to the index
   */
  private addDocumentToIndex(doc: IndexedDocument, tokens: TokenInfo[]): void {
    this.index.documentIndex.set(doc.id, doc);
    this.index.totalDocuments++;
    
    tokens.forEach(({ token, weight, positions, field }) => {
      // Add to inverted index
      if (!this.index.invertedIndex.has(token)) {
        this.index.invertedIndex.set(token, {
          termFrequency: new Map(),
          documentFrequency: 0,
          positions: new Map()
        });
      }
      
      const postingList = this.index.invertedIndex.get(token)!;
      
      // Update term frequency
      const currentTF = postingList.termFrequency.get(doc.id) || 0;
      postingList.termFrequency.set(doc.id, currentTF + weight);
      
      // Update document frequency (only count once per document)
      if (currentTF === 0) {
        postingList.documentFrequency++;
      }
      
      // Update positions
      const currentPositions = postingList.positions.get(doc.id) || [];
      postingList.positions.set(doc.id, [...currentPositions, ...positions]);
      
      // Add to n-gram index if it's an n-gram
      if (token.startsWith('#') && token.endsWith('#')) {
        if (!this.index.ngramIndex.has(token)) {
          this.index.ngramIndex.set(token, new Set());
        }
        this.index.ngramIndex.get(token)!.add(doc.id);
      }
    });
  }

  /**
   * Exact match search using inverted index
   */
  private async exactMatchSearch(query: string): Promise<SearchResult[]> {
    const tokens = query.toLowerCase().split(/\s+/).filter(token => 
      token.length >= 2 && !this.stopWords.has(token)
    );
    
    if (tokens.length === 0) return [];
    
    const candidateSets: Set<number>[] = [];
    
    // Get candidate documents for each token
    tokens.forEach(token => {
      const postingList = this.index.invertedIndex.get(token);
      if (postingList) {
        candidateSets.push(new Set(postingList.termFrequency.keys()));
      }
    });
    
    if (candidateSets.length === 0) return [];
    
    // Intersection for AND semantics
    const intersection = candidateSets.reduce((acc, set) => 
      new Set([...acc].filter(id => set.has(id)))
    );
    
    // Score and sort results
    return Array.from(intersection)
      .map(id => ({
        id,
        type: this.index.documentIndex.get(id)?.type || 'recipe' as const,
        score: this.calculateTFIDFScore(id, tokens),
        matchType: 'exact' as const,
        highlights: this.findHighlights(id, tokens)
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Prefix match search
   */
  private async prefixMatchSearch(query: string): Promise<SearchResult[]> {
    const queryTokens = query.toLowerCase().split(/\s+/).filter(token => 
      token.length >= 2 && !this.stopWords.has(token)
    );
    
    const results = new Map<number, SearchResult>();
    
    queryTokens.forEach(queryToken => {
      for (const [term, postingList] of this.index.invertedIndex.entries()) {
        if (term.startsWith(queryToken) && !term.startsWith('#')) {
          for (const docId of postingList.termFrequency.keys()) {
            const doc = this.index.documentIndex.get(docId);
            if (!doc) continue;
            
            const existingResult = results.get(docId);
            const score = this.calculateTFIDFScore(docId, [term]) * 0.8; // Lower weight for prefix
            
            if (!existingResult || score > existingResult.score) {
              results.set(docId, {
                id: docId,
                type: doc.type,
                score,
                matchType: 'prefix' as const,
                highlights: this.findHighlights(docId, [term])
              });
            }
          }
        }
      }
    });
    
    return Array.from(results.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Fuzzy match search using n-grams
   */
  private async fuzzyMatchSearch(query: string): Promise<SearchResult[]> {
    const queryTokens = query.toLowerCase().split(/\s+/).filter(token => 
      token.length >= 3 && !this.stopWords.has(token)
    );
    
    const candidateScores = new Map<number, number>();
    
    queryTokens.forEach(queryToken => {
      if (queryToken.length < 4) return;
      
      // Generate n-grams for the query token
      for (let i = 0; i <= queryToken.length - 3; i++) {
        const ngram = `#${queryToken.substring(i, i + 3)}#`;
        const ngramDocs = this.index.ngramIndex.get(ngram);
        
        if (ngramDocs) {
          for (const docId of ngramDocs) {
            const currentScore = candidateScores.get(docId) || 0;
            candidateScores.set(docId, currentScore + 0.3); // Lower weight for fuzzy
          }
        }
      }
    });
    
    return Array.from(candidateScores.entries())
      .map(([docId, score]) => {
        const doc = this.index.documentIndex.get(docId);
        return {
          id: docId,
          type: doc?.type || 'recipe' as const,
          score,
          matchType: 'fuzzy' as const,
          highlights: []
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate TF-IDF score for relevance ranking
   */
  private calculateTFIDFScore(documentId: number, queryTokens: string[]): number {
    let score = 0;
    const doc = this.index.documentIndex.get(documentId);
    if (!doc) return 0;
    
    queryTokens.forEach(token => {
      const postingList = this.index.invertedIndex.get(token);
      if (!postingList) return;
      
      const tf = postingList.termFrequency.get(documentId) || 0;
      const df = postingList.documentFrequency;
      
      // TF-IDF calculation
      const tfScore = tf / doc.length;
      const idfScore = Math.log(this.index.totalDocuments / (df + 1));
      
      score += tfScore * idfScore;
    });
    
    return score;
  }

  /**
   * Find highlight positions for search results
   */
  private findHighlights(documentId: number, tokens: string[]): { field: string; positions: number[] }[] {
    const highlights: { field: string; positions: number[] }[] = [];
    
    tokens.forEach(token => {
      const postingList = this.index.invertedIndex.get(token);
      if (postingList) {
        const positions = postingList.positions.get(documentId) || [];
        if (positions.length > 0) {
          highlights.push({ field: 'content', positions });
        }
      }
    });
    
    return highlights;
  }

  /**
   * Merge and deduplicate search results
   */
  private mergeAndDeduplicateResults(results1: SearchResult[], results2: SearchResult[]): SearchResult[] {
    const merged = new Map<number, SearchResult>();
    
    // Add results1 with priority
    results1.forEach(result => merged.set(result.id, result));
    
    // Add results2 only if not already present or if score is higher
    results2.forEach(result => {
      const existing = merged.get(result.id);
      if (!existing || result.score > existing.score) {
        merged.set(result.id, result);
      }
    });
    
    return Array.from(merged.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Build searchable content from recipe
   */
  private buildRecipeContent(recipe: Recipe): string {
    const parts = [
      recipe.title,
      recipe.description || '',
      recipe.ingredients,
      recipe.tags?.map((t: Tag) => t.name).join(' ') || ''
    ];
    
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Clear the search index
   */
  private clearIndex(): void {
    this.index = {
      invertedIndex: new Map(),
      ngramIndex: new Map(),
      documentIndex: new Map(),
      totalDocuments: 0
    };
  }

  /**
   * Optimize index after building (placeholder for future optimizations)
   */
  private optimizeIndex(): void {
    // Future optimizations:
    // - Compress posting lists
    // - Remove very low-frequency terms
    // - Build skip lists for faster intersection
  }

  /**
   * Log search performance metrics
   */
  private logSearchPerformance(query: string, duration: number, resultCount: number): void {
    if (duration > 100) {
      console.warn(`Slow search: "${query}" took ${duration.toFixed(2)}ms, returned ${resultCount} results`);
    }
  }
}

export default SearchIndexService;
export type { SearchResult, SearchIndex, IndexedDocument };