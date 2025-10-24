import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { vim, getCM } from "@replit/codemirror-vim";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Props interface for the VimEditor component
 *
 * This component provides a full-featured markdown editor with Vim keybindings,
 * syntax highlighting, and scroll synchronization capabilities.
 */
interface VimEditorProps {
  /** The current markdown content to display in the editor */
  value: string;
  /** Callback fired when the editor content changes */
  onChange: (value: string) => void;
  /** Optional callback fired when cursor position changes (line, column) */
  onCursorChange?: (line: number, column: number) => void;
  /** Optional callback fired when Vim mode changes (normal, insert, visual) */
  onVimModeChange?: (mode: string) => void;
  /** Optional callback fired when editor scrolls (returns scroll percentage 0-1) */
  onScroll?: (scrollPercentage: number) => void;
  /** Optional scroll position to sync to (percentage 0-1) */
  syncScrollTop?: number;
  /** Whether scroll synchronization is enabled */
  isScrollSyncEnabled?: boolean;
}

/**
 * VimEditor Component
 *
 * A CodeMirror-based markdown editor with Vim keybindings, syntax highlighting,
 * and scroll synchronization. Features:
 * - Full Vim modal editing (normal, insert, visual modes)
 * - Markdown syntax highlighting with theme support
 * - Automatic text wrapping
 * - Scroll synchronization with preview pane
 * - Real-time cursor position and mode tracking
 */
export default function VimEditor({
  value,
  onChange,
  onCursorChange,
  onVimModeChange,
  onScroll,
  syncScrollTop,
  isScrollSyncEnabled
}: VimEditorProps) {
  // Ref to the DOM element that will contain the CodeMirror editor
  const editorRef = useRef<HTMLDivElement>(null);
  // Ref to the CodeMirror EditorView instance for direct access
  const viewRef = useRef<EditorView | null>(null);
  // Get current theme (light/dark) from context
  const { theme } = useTheme();
  // Flag to prevent infinite scroll loops during synchronization
  const isScrollingFromSync = useRef(false);

  /**
   * Main effect that creates and configures the CodeMirror editor instance.
   * Runs when the component mounts and when the theme changes.
   *
   * This effect handles:
   * - Creating the editor with all extensions and themes
   * - Setting up event listeners for content changes, cursor tracking, and scrolling
   * - Configuring Vim mode tracking
   * - Cleanup when component unmounts or theme changes
   */
  useEffect(() => {
    if (!editorRef.current) return;

    // Define syntax highlighting colors for light mode
    // These colors follow GitHub's markdown styling conventions
    const lightHighlight = HighlightStyle.define([
      { tag: tags.heading1, color: "#0969da", fontWeight: "bold" },
      { tag: tags.heading2, color: "#0969da", fontWeight: "bold" },
      { tag: tags.heading3, color: "#0969da", fontWeight: "bold" },
      { tag: tags.heading4, color: "#0969da", fontWeight: "bold" },
      { tag: tags.heading5, color: "#0969da", fontWeight: "bold" },
      { tag: tags.heading6, color: "#656d76", fontWeight: "bold" },
      { tag: tags.strong, color: "#1f2328", fontWeight: "bold" },
      { tag: tags.emphasis, color: "#8250df", fontStyle: "italic" },
      { tag: tags.strikethrough, textDecoration: "line-through" },
      { tag: tags.link, color: "#0969da", textDecoration: "underline" },
      { tag: tags.url, color: "#0969da" },
      { tag: tags.monospace, color: "#0550ae", backgroundColor: "#f6f8fa" },
      { tag: tags.quote, color: "#656d76", fontStyle: "italic" },
      { tag: tags.list, color: "#1f2328" },
      { tag: tags.punctuation, color: "#1f2328" },
      { tag: tags.content, color: "#1f2328" },
      { tag: tags.keyword, color: "#cf222e" },
      { tag: tags.string, color: "#0a3069" },
      { tag: tags.comment, color: "#656d76", fontStyle: "italic" },
    ]);

    // Define syntax highlighting colors for dark mode
    // Uses softer, easier-on-the-eyes colors for dark backgrounds
    const darkHighlight = HighlightStyle.define([
      { tag: tags.heading1, color: "#7dd3fc", fontWeight: "bold" },
      { tag: tags.heading2, color: "#7dd3fc", fontWeight: "bold" },
      { tag: tags.heading3, color: "#7dd3fc", fontWeight: "bold" },
      { tag: tags.heading4, color: "#7dd3fc", fontWeight: "bold" },
      { tag: tags.heading5, color: "#7dd3fc", fontWeight: "bold" },
      { tag: tags.heading6, color: "#9ca3af", fontWeight: "bold" },
      { tag: tags.strong, color: "#d1d5db", fontWeight: "bold" },
      { tag: tags.emphasis, color: "#c084fc", fontStyle: "italic" },
      { tag: tags.strikethrough, textDecoration: "line-through" },
      { tag: tags.link, color: "#60a5fa", textDecoration: "underline" },
      { tag: tags.url, color: "#60a5fa" },
      { tag: tags.monospace, color: "#fbbf24", backgroundColor: "#374151" },
      { tag: tags.quote, color: "#9ca3af", fontStyle: "italic" },
      { tag: tags.list, color: "#d1d5db" },
      { tag: tags.punctuation, color: "#d1d5db" },
      { tag: tags.content, color: "#d1d5db" },
      { tag: tags.keyword, color: "#f87171" },
      { tag: tags.string, color: "#34d399" },
      { tag: tags.comment, color: "#9ca3af", fontStyle: "italic" },
    ]);

    // Create the editor state with all necessary extensions
    const state = EditorState.create({
      doc: value, // Initial document content
      extensions: [
        // Basic editor functionality (line numbers, search, undo/redo, etc.)
        basicSetup,
        // Enable automatic line wrapping for better readability
        EditorView.lineWrapping,
        // Markdown language support for syntax highlighting
        markdown(),
        // Vim keybindings and modal editing
        vim(),
        // Apply theme-appropriate syntax highlighting
        syntaxHighlighting(theme === 'dark' ? darkHighlight : lightHighlight),

        // Update listener to handle editor events and state changes
        EditorView.updateListener.of((update) => {
          // Notify parent component when document content changes
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }

          // Track and report cursor position changes for status bar
          if (update.selectionSet && onCursorChange) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            // Convert to 1-based line numbers and column positions
            onCursorChange(line.number, pos - line.from + 1);
          }

          // Track Vim mode changes (normal, insert, visual) for status bar
          if (onVimModeChange) {
            try {
              // Access the underlying CodeMirror instance to get Vim state
              const cm = getCM(update.view);
              if (cm && cm.state && cm.state.vim) {
                const mode = cm.state.vim.mode || 'normal';
                onVimModeChange(mode);
              }
            } catch (e) {
              // Gracefully handle cases where Vim state is not yet available
            }
          }
        }),

        // Base editor theme that applies to both light and dark modes
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px",
            fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
          },
          ".cm-content": {
            padding: "16px",
            lineHeight: "1.5",
            whiteSpace: "pre-wrap", // Allow text wrapping while preserving formatting
          },
          ".cm-editor": {
            height: "100%",
          },
          ".cm-scroller": {
            height: "100%",
          },
          ".cm-focused": {
            outline: "none", // Remove default focus outline
          },
          ".cm-line": {
            wordWrap: "break-word", // Break long words to prevent horizontal overflow
          },
        }),

        // Theme-specific styling based on current theme (light/dark)
        theme === 'dark' ? EditorView.theme({
          "&": {
            backgroundColor: "#000000",
            color: "#d1d5db",
          },
          ".cm-content": {
            caretColor: "#ffffff",
          },
          ".cm-cursor, .cm-dropCursor": {
            borderLeftColor: "#ffffff",
          },
          "&.cm-focused .cm-cursor": {
            borderLeftColor: "#ffffff",
          },
          ".cm-selectionBackground, ::selection": {
            backgroundColor: "#374151",
          },
          ".cm-activeLine": {
            backgroundColor: "#2d3748",
          },
          ".cm-gutters": {
            backgroundColor: "#000000",
            color: "#9ca3af",
            border: "none",
          },
          ".cm-vim-fat-cursor": {
            backgroundColor: "#ffffff !important",
            color: "#000000 !important",
            border: "none !important",
          },
        }, { dark: true }) : EditorView.theme({
          "&": {
            backgroundColor: "#ffffff",
            color: "#1f2328",
          },
          ".cm-content": {
            caretColor: "#000000",
          },
          ".cm-vim-fat-cursor": {
            backgroundColor: "black !important",
            border: "none !important",
          },
          ".cm-cursor, .cm-dropCursor": {
            borderLeftColor: "black",
          },
          "&.cm-focused .cm-cursor": {
            borderLeftColor: "black",
          },
          ".cm-line ::selection": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
          ".cm-vim-fat-cursor::selection": {
            backgroundColor: "black !important",
            color: "white !important",
          },
          ".cm-activeLine": {
            backgroundColor: "#f6f8fa",
          },
          ".cm-gutters": {
            backgroundColor: "#ffffff",
            color: "#656d76",
            border: "none",
          },
        }),
      ],
    });

    // Create the actual CodeMirror editor view and attach it to the DOM
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    // Store the view reference for use in other effects
    viewRef.current = view;

    // Automatically focus the editor when it's created for better UX
    view.focus();

    /**
     * Set up scroll event listener for scroll synchronization.
     * We use percentage-based scrolling to ensure content alignment
     * between editor and preview regardless of their different heights.
     */
    const handleScroll = () => {
      if (onScroll && !isScrollingFromSync.current) {
        const scrollTop = view.scrollDOM.scrollTop;
        const scrollHeight = view.scrollDOM.scrollHeight;
        const clientHeight = view.scrollDOM.clientHeight;

        // Calculate scroll percentage (0-1) based on current position
        const maxScroll = scrollHeight - clientHeight;
        const scrollPercentage = maxScroll > 0 ? scrollTop / maxScroll : 0;

        // Report the scroll percentage to parent for synchronization
        onScroll(scrollPercentage);
      }
    };

    // Add scroll listener with passive flag for better performance
    view.scrollDOM.addEventListener('scroll', handleScroll, { passive: true });

    /**
     * Cleanup function: remove listeners and destroy editor instance.
     * Note: Vim mode tracking is handled by EditorView.updateListener above,
     * which fires on state changes rather than polling.
     */
    return () => {
      view.scrollDOM.removeEventListener('scroll', handleScroll);
      view.destroy();
    };
  }, [theme, onScroll]); // Re-run when theme changes or scroll callback changes

  /**
   * Effect to handle external value changes (when parent updates the content).
   * This ensures the editor stays in sync with external state changes
   * while avoiding unnecessary updates when the change originated from the editor itself.
   */
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      // Update the entire document content with the new value
      viewRef.current.dispatch({
        changes: {
          from: 0, // Start of document
          to: viewRef.current.state.doc.length, // End of document
          insert: value, // New content to insert
        },
      });
    }
  }, [value]); // Re-run when the value prop changes

  /**
   * Effect to handle scroll synchronization from the preview pane.
   * When the preview scrolls, this effect will scroll the editor to the
   * corresponding position based on the percentage provided.
   */
  useEffect(() => {
    if (viewRef.current && syncScrollTop !== undefined && isScrollSyncEnabled) {
      // Set flag to prevent our own scroll event from triggering sync
      isScrollingFromSync.current = true;
      const scroller = viewRef.current.scrollDOM;

      // Convert the received scroll percentage back to actual scroll position
      const scrollHeight = scroller.scrollHeight;
      const clientHeight = scroller.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      const targetScrollTop = maxScroll * syncScrollTop;

      // Apply the calculated scroll position
      scroller.scrollTop = targetScrollTop;

      // Reset the flag after a brief delay to allow for smooth scrolling
      setTimeout(() => {
        isScrollingFromSync.current = false;
      }, 100);
    }
  }, [syncScrollTop, isScrollSyncEnabled]); // Re-run when sync values change

  return <div ref={editorRef} className="vim-editor" />;
}