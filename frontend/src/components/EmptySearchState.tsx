import React, { useState, useEffect } from 'react';

interface EmptySearchStateProps {
  onSearchFocus?: () => void;
}

const EmptySearchState: React.FC<EmptySearchStateProps> = ({ onSearchFocus }) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const searchTips = [
    {
      icon: '🔍',
      title: 'Search by ingredient',
      description: 'Try "chicken" or "pasta" to find recipes',
      example: 'chicken pasta'
    },
    {
      icon: '🏷️',
      title: 'Browse by category',
      description: 'Search for "dessert" or "quick meals"',
      example: 'quick meals'
    },
    {
      icon: '🥗',
      title: 'Find specific dishes',
      description: 'Look for "caesar salad" or "chocolate cake"',
      example: 'chocolate cake'
    },
    {
      icon: '⚡',
      title: 'Use quick filters',
      description: 'Try "vegetarian" or "30 minutes" for easy filtering',
      example: 'vegetarian'
    }
  ];

  const popularSearches = [
    { term: 'chicken', icon: '🍗', color: '#e74c3c' },
    { term: 'pasta', icon: '🍝', color: '#f39c12' },
    { term: 'dessert', icon: '🧁', color: '#e91e63' },
    { term: 'quick meals', icon: '⚡', color: '#9b59b6' },
    { term: 'healthy', icon: '🥗', color: '#27ae60' },
    { term: 'vegetarian', icon: '🌱', color: '#2ecc71' },
    { term: 'soup', icon: '🍲', color: '#3498db' },
    { term: 'breakfast', icon: '🥞', color: '#f1c40f' }
  ];

  // Rotate tips every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % searchTips.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [searchTips.length]);

  const handlePopularSearchClick = (term: string) => {
    // This would trigger a search - for now just focus search
    onSearchFocus?.();
    // In a real implementation, you'd call onChange with the term
  };

  return (
    <div className="empty-search-state">
      {/* Hero section */}
      <div className="hero-section">
        <div className="hero-icon">👨‍🍳</div>
        <h2 className="hero-title">Discover Amazing Recipes</h2>
        <p className="hero-description">
          Search through thousands of recipes by ingredients, categories, or dish names
        </p>
        
        <button 
          className="start-searching-button"
          onClick={onSearchFocus}
        >
          <span className="button-icon">🔍</span>
          Start Searching
        </button>
      </div>

      {/* Search tips */}
      <div className="tips-section">
        <div className="tips-header">
          <h3>💡 Search Tips</h3>
          <div className="tip-indicators">
            {searchTips.map((_, index) => (
              <div
                key={index}
                className={`tip-indicator ${index === currentTipIndex ? 'active' : ''}`}
                onClick={() => setCurrentTipIndex(index)}
              />
            ))}
          </div>
        </div>
        
        <div className="tip-card">
          <div className="tip-icon">{searchTips[currentTipIndex].icon}</div>
          <div className="tip-content">
            <h4>{searchTips[currentTipIndex].title}</h4>
            <p>{searchTips[currentTipIndex].description}</p>
            <div className="tip-example">
              Try: <code>{searchTips[currentTipIndex].example}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Popular searches */}
      <div className="popular-section">
        <h3>🔥 Popular Searches</h3>
        <div className="popular-grid">
          {popularSearches.map((search, index) => (
            <button
              key={search.term}
              className="popular-search-item"
              onClick={() => handlePopularSearchClick(search.term)}
              style={{ 
                animationDelay: `${index * 0.1}s`,
                '--accent-color': search.color
              } as React.CSSProperties}
            >
              <span className="popular-icon">{search.icon}</span>
              <span className="popular-term">{search.term}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="features-section">
        <h3>✨ Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">🌳</div>
            <h4>Hierarchical Browsing</h4>
            <p>Explore recipes organized by categories and tags</p>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <h4>Instant Search</h4>
            <p>Real-time results as you type with smart suggestions</p>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">🎯</div>
            <h4>Smart Filtering</h4>
            <p>Find exactly what you're looking for with intelligent filters</p>
          </div>
        </div>
      </div>

      <style>{`
        .empty-search-state {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 0;
          text-align: center;
          min-height: 500px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 3rem;
        }

        /* Hero Section */
        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .hero-icon {
          font-size: 4rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 1.2rem;
          color: #666;
          margin: 0;
          max-width: 500px;
          line-height: 1.6;
        }

        .start-searching-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .start-searching-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
        }

        .button-icon {
          font-size: 1.2rem;
        }

        /* Tips Section */
        .tips-section {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .tips-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .tips-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.3rem;
        }

        .tip-indicators {
          display: flex;
          gap: 0.5rem;
        }

        .tip-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ddd;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tip-indicator.active {
          background: #667eea;
          transform: scale(1.2);
        }

        .tip-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          text-align: left;
          min-height: 80px;
        }

        .tip-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .tip-content h4 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .tip-content p {
          margin: 0 0 0.5rem 0;
          color: #666;
          line-height: 1.5;
        }

        .tip-example {
          font-size: 0.9rem;
          color: #888;
        }

        .tip-example code {
          background: #f8f9fa;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          color: #667eea;
          font-weight: 500;
        }

        /* Popular Searches */
        .popular-section h3 {
          margin: 0 0 1.5rem 0;
          color: #2c3e50;
          font-size: 1.3rem;
        }

        .popular-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .popular-search-item {
          background: white;
          border: 2px solid #f1f1f1;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .popular-search-item:hover {
          border-color: var(--accent-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .popular-icon {
          font-size: 1.5rem;
        }

        .popular-term {
          font-weight: 500;
          color: #333;
          font-size: 0.9rem;
        }

        /* Features Section */
        .features-section h3 {
          margin: 0 0 1.5rem 0;
          color: #2c3e50;
          font-size: 1.3rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .feature-item {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease;
        }

        .feature-item:hover {
          transform: translateY(-2px);
        }

        .feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .feature-item h4 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .feature-item p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .empty-search-state {
            padding: 1rem 0;
            gap: 2rem;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-description {
            font-size: 1rem;
          }

          .tips-section {
            padding: 1.5rem;
          }

          .tip-card {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .popular-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .hero-icon {
            font-size: 3rem;
          }

          .hero-title {
            font-size: 1.75rem;
          }

          .start-searching-button {
            padding: 0.8rem 1.5rem;
            font-size: 1rem;
          }

          .popular-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default EmptySearchState;