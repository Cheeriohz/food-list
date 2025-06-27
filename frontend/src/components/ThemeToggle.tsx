import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme, isDark } = useTheme();
  
  const handleToggle = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return isDark ? '🌙' : '☀️';
    }
    return theme === 'dark' ? '🌙' : '☀️';
  };

  const getLabel = () => {
    if (theme === 'system') {
      return `Switch to ${isDark ? 'light' : 'dark'} mode (currently system: ${isDark ? 'dark' : 'light'})`;
    }
    return `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`;
  };

  return (
    <button
      onClick={handleToggle}
      className={`theme-toggle ${className}`}
      aria-label={getLabel()}
      title={getLabel()}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '0.5rem',
        cursor: 'pointer',
        fontSize: '1.2rem',
        transition: 'all var(--transition-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '2.5rem',
        height: '2.5rem'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'var(--color-surface-hover)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'var(--color-surface)';
      }}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;