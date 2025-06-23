import React from 'react';

interface EmptySearchStateProps {
  onSearchFocus?: () => void;
}

const EmptySearchState: React.FC<EmptySearchStateProps> = ({ onSearchFocus }) => {


  return (
    <div className="empty-search-state">
      <div className="hero-section">
        <div className="hero-icon">🍳</div>
        <h1 className="hero-title">Find Your Perfect Recipe</h1>
        <p className="hero-description">
          Search through our collection of delicious recipes by ingredient, cuisine, or dish name
        </p>
        <button 
          className="start-searching-button"
          onClick={onSearchFocus}
        >
          <span className="button-icon">🔍</span>
          Start Searching
        </button>
      </div>



      <style>{`
        .empty-search-state {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Hero Section */
        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          max-width: 600px;
          padding: 2rem;
          animation: fadeInScale 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .hero-icon {
          font-size: 5rem;
          animation: float 3s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: #2c3e50;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .hero-description {
          font-size: 1.3rem;
          color: #5a6c7d;
          margin: 0;
          line-height: 1.6;
          font-weight: 400;
        }

        .start-searching-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1.25rem 2.5rem;
          border-radius: 60px;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
        }

        .start-searching-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .start-searching-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
        }

        .start-searching-button:hover::before {
          left: 100%;
        }

        .start-searching-button:active {
          transform: translateY(-1px);
        }

        .button-icon {
          font-size: 1.3rem;
        }




        /* Responsive Design */
        @media (max-width: 768px) {
          .hero-section {
            gap: 1.5rem;
            padding: 1.5rem;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-description {
            font-size: 1.1rem;
          }

          .hero-icon {
            font-size: 4rem;
          }

          .start-searching-button {
            padding: 1rem 2rem;
            font-size: 1.1rem;
          }
        }

        @media (max-width: 480px) {
          .hero-section {
            gap: 1rem;
            padding: 1rem;
          }

          .hero-icon {
            font-size: 3.5rem;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-description {
            font-size: 1rem;
          }

          .start-searching-button {
            padding: 0.875rem 1.75rem;
            font-size: 1rem;
          }

          .button-icon {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EmptySearchState;