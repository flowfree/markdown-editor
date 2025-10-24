import { useTheme } from '../contexts/ThemeContext';

/**
 * Props interface for the StatusBar component
 *
 * The status bar displays real-time information about the editor state
 * and provides quick access to theme switching functionality.
 */
interface StatusBarProps {
  /** Current word count of the document */
  wordCount: number;
  /** Current Vim mode (normal, insert, visual, etc.) */
  vimMode: string;
  /** Current cursor line position (1-based) */
  line: number;
  /** Current cursor column position (1-based) */
  column: number;
}

/**
 * StatusBar Component
 *
 * A bottom status bar that displays real-time editor information and controls.
 * Features:
 * - Live word count tracking
 * - Current cursor position (line and column)
 * - Vim mode indicator with visual highlighting
 * - Theme toggle button for switching between light/dark modes
 * - Responsive design with proper dark mode styling
 */
export default function StatusBar({ wordCount, vimMode, line, column }: StatusBarProps) {
  // Get current theme and toggle function from theme context
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="status-bar flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 text-xs">
      {/* Left side: Editor statistics and state information */}
      <div className="flex items-center gap-4">
        {/* Word count display */}
        <span className="text-gray-600 dark:text-gray-400">
          Words: {wordCount}
        </span>

        {/* Cursor position display (line, column) */}
        <span className="text-gray-600 dark:text-gray-400">
          Ln {line}, Col {column}
        </span>

        {/* Vim mode indicator with highlighting */}
        <span className="px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-400">
          {vimMode.toUpperCase()}
        </span>
      </div>

      {/* Right side: Theme toggle button */}
      <button
        onClick={toggleTheme}
        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode (resets to system theme on restart)`}
      >
        {/* Button text changes based on current theme */}
        {theme === 'light' ? 'Dark' : 'Light'}
      </button>
    </div>
  );
}