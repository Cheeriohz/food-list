import { useState, useCallback } from 'react';
import { Recipe } from '../types';
import {
  calculateComplexityScore,
  getMetricComparison,
  classifyMetricValue,
  getMetricValue,
  formatMetricValue,
  getMetricConfig,
  toggleArrayItem
} from '../utils/recipeComparisonUtils';

interface RecipeComparisonProps {
  recipes: Recipe[];
  onClose: () => void;
  onRemoveRecipe: (recipeId: string | number) => void;
}


const RecipeComparison: React.FC<RecipeComparisonProps> = ({
  recipes,
  onClose,
  onRemoveRecipe
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'prep_time',
    'cook_time',
    'servings',
    'ingredients_count',
    'tags'
  ]);

  const metricConfig = getMetricConfig();

  const handleMetricToggle = useCallback((metricKey: string) => {
    setSelectedMetrics(prev => toggleArrayItem(prev, metricKey));
  }, []);

  const getMetricStats = useCallback((metricKey: string) => {
    return getMetricComparison(recipes, metricKey);
  }, [recipes]);

  const renderMetricCell = useCallback((recipe: Recipe, metricKey: string) => {
    const value = getMetricValue(recipe, metricKey);
    const formattedValue = formatMetricValue(value, metricKey);
    
    let className = 'metric-cell';
    
    // Add highlighting for numeric values
    if (metricConfig[metricKey]?.isNumeric && value !== undefined && value !== null) {
      const stats = getMetricStats(metricKey);
      if (stats) {
        const classification = classifyMetricValue(value, stats);
        if (classification === 'best') className += ' best-value';
        else if (classification === 'worst') className += ' worst-value';
      }
    }

    return (
      <td key={metricKey} className={className}>
        {formattedValue}
      </td>
    );
  }, [metricConfig, getMetricStats]);

  const renderComplexityScore = useCallback((recipe: Recipe) => {
    const { score, level, color } = calculateComplexityScore(recipe);

    return (
      <div className="complexity-score" style={{ color }}>
        <div className="score-label">{level}</div>
        <div className="score-value">{Math.round(score)}</div>
      </div>
    );
  }, []);

  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="recipe-comparison-overlay">
      <div className="recipe-comparison-modal">
        <div className="comparison-header">
          <h2>Recipe Comparison ({recipes.length} recipes)</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="comparison-controls">
          <div className="metrics-selector">
            <h3>Compare By:</h3>
            <div className="metrics-grid">
              {Object.entries(metricConfig).map(([key, metric]) => (
                <label key={key} className="metric-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(key)}
                    onChange={() => handleMetricToggle(key)}
                  />
                  <span>{metric.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="comparison-table-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="recipe-header">Recipe</th>
                {selectedMetrics.map(metricKey => (
                  <th key={metricKey} className="metric-header">
                    {metricConfig[metricKey].label}
                    {metricConfig[metricKey].isNumeric && (
                      <div className="metric-stats">
                        {(() => {
                          const stats = getMetricStats(metricKey);
                          return stats ? (
                            <span className="stats-text">
                              Min: {stats.min} | Max: {stats.max} | Avg: {Math.round(stats.avg)}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </th>
                ))}
                <th className="complexity-header">Complexity</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map(recipe => (
                <tr key={recipe.id} className="recipe-row">
                  <td className="recipe-info">
                    <div className="recipe-name">{recipe.title}</div>
                    {recipe.description && (
                      <div className="recipe-description">{recipe.description}</div>
                    )}
                    <button
                      className="remove-recipe"
                      onClick={() => recipe.id && onRemoveRecipe(recipe.id.toString())}
                      title="Remove from comparison"
                    >
                      Remove
                    </button>
                  </td>
                  {selectedMetrics.map(metricKey => 
                    renderMetricCell(recipe, metricKey)
                  )}
                  <td className="complexity-cell">
                    {renderComplexityScore(recipe)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="comparison-footer">
          <div className="legend">
            <span className="legend-item">
              <span className="best-indicator"></span> Best Value
            </span>
            <span className="legend-item">
              <span className="worst-indicator"></span> Highest Value
            </span>
          </div>
        </div>

        <style>{`
          .recipe-comparison-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
            padding: 2rem;
          }

          .recipe-comparison-modal {
            background: white;
            border-radius: 12px;
            max-width: 95vw;
            max-height: 90vh;
            width: 100%;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .comparison-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e9ecef;
          }

          .comparison-header h2 {
            margin: 0;
            color: #2c3e50;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
            padding: 0.25rem;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .close-button:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #333;
          }

          .comparison-controls {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e9ecef;
            background: #f8f9fa;
          }

          .comparison-controls h3 {
            margin: 0 0 1rem 0;
            color: #2c3e50;
            font-size: 1rem;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.5rem;
          }

          .metric-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-size: 0.9rem;
          }

          .metric-checkbox input {
            margin: 0;
          }

          .comparison-table-container {
            flex: 1;
            overflow: auto;
            padding: 1rem;
          }

          .comparison-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
          }

          .comparison-table th,
          .comparison-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
          }

          .comparison-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .recipe-header,
          .recipe-info {
            min-width: 200px;
            max-width: 250px;
          }

          .metric-header {
            min-width: 120px;
            text-align: center;
          }

          .metric-stats {
            font-size: 0.7rem;
            color: #666;
            font-weight: normal;
            margin-top: 0.25rem;
          }

          .stats-text {
            display: block;
            white-space: nowrap;
          }

          .recipe-name {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 0.25rem;
          }

          .recipe-description {
            font-size: 0.8rem;
            color: #666;
            margin-bottom: 0.5rem;
            line-height: 1.3;
          }

          .remove-recipe {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: background 0.2s ease;
          }

          .remove-recipe:hover {
            background: #c0392b;
          }

          .metric-cell {
            text-align: center;
            font-weight: 500;
          }

          .metric-cell.best-value {
            background: rgba(76, 175, 80, 0.1);
            color: #2e7d32;
            font-weight: 600;
          }

          .metric-cell.worst-value {
            background: rgba(244, 67, 54, 0.1);
            color: #c62828;
            font-weight: 600;
          }

          .complexity-cell {
            text-align: center;
          }

          .complexity-score {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-weight: 600;
          }

          .score-label {
            font-size: 0.8rem;
            margin-bottom: 0.25rem;
          }

          .score-value {
            font-size: 0.7rem;
            opacity: 0.7;
          }

          .comparison-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid #e9ecef;
            background: #f8f9fa;
          }

          .legend {
            display: flex;
            gap: 2rem;
            justify-content: center;
            font-size: 0.8rem;
          }

          .legend-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .best-indicator,
          .worst-indicator {
            width: 12px;
            height: 12px;
            border-radius: 2px;
          }

          .best-indicator {
            background: rgba(76, 175, 80, 0.3);
            border: 1px solid #4caf50;
          }

          .worst-indicator {
            background: rgba(244, 67, 54, 0.3);
            border: 1px solid #f44336;
          }

          @media (max-width: 768px) {
            .recipe-comparison-overlay {
              padding: 1rem;
            }

            .comparison-header {
              padding: 1rem;
            }

            .comparison-controls {
              padding: 0.75rem 1rem;
            }

            .metrics-grid {
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 0.25rem;
            }

            .comparison-table {
              font-size: 0.8rem;
            }

            .comparison-table th,
            .comparison-table td {
              padding: 0.5rem 0.25rem;
            }

            .recipe-header,
            .recipe-info {
              min-width: 150px;
              max-width: 180px;
            }

            .metric-header {
              min-width: 80px;
            }

            .legend {
              flex-direction: column;
              gap: 0.5rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default RecipeComparison;