import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { json } from '@codemirror/lang-json';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { xml } from '@codemirror/lang-xml';
import { useEditorStore } from '../../store/editorStore';
import { useUIStore } from '../../store/uiStore';
import { useMarkdownParser } from '../../hooks/useMarkdownParser';
import { useTheme } from '../../hooks/useTheme';
import type { EditorNavigationRef } from '../../types/editor';

interface CodeMirrorEditorProps {
  className?: string;
}

export const CodeMirrorEditor = forwardRef<EditorNavigationRef, CodeMirrorEditorProps>(({ className = '' }, ref) => {
  const { content, setContent, setIsModified } = useEditorStore();
  const { theme } = useUIStore();
  const { effectiveTheme } = useTheme();
  const { debouncedParse } = useMarkdownParser();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Expose navigation methods via ref
  useImperativeHandle(ref, () => ({
    navigateToLine: (line: number) => {
      if (viewRef.current && content) {
        const lines = content.split('\n');
        let charPosition = 0;

        // Calculate character position for the target line
        for (let i = 0; i < Math.min(line, lines.length - 1); i++) {
          charPosition += lines[i].length + 1; // +1 for newline character
        }

        const pos = Math.min(charPosition, content.length);

        // Set cursor position and scroll into view
        viewRef.current.dispatch({
          selection: { anchor: pos, head: pos },
          scrollIntoView: true
        });

        console.log(`CodeMirror: Navigated to line ${line + 1}, position ${pos}`);
      }
    },
    focus: () => {
      if (viewRef.current) {
        viewRef.current.focus();
      }
    }
  }), [content]);

  useEffect(() => {
    if (!editorRef.current) return;

    const languageMap = {
      javascript: javascript(),
      js: javascript(),
      typescript: javascript(), // Using JavaScript for TypeScript as well
      ts: javascript(),
      python: python(),
      py: python(),
      rust: rust(),
      rs: rust(),
      json: json(),
      css: css(),
      html: html(),
      xml: xml(),
    };

    const extensions = [
      basicSetup,
      keymap.of([indentWithTab]),
      markdown({
        codeLanguages: languageMap,
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          setContent(newContent);
          setIsModified(true);
          debouncedParse(newContent);
        }
      }),
    ];

    // Dark theme support (add before custom theme to allow overrides)
    if (effectiveTheme === 'dark') {
      extensions.push(oneDark);
    }

    // Custom theme overrides (must come after base themes)
    extensions.push(
      EditorView.theme({
        '&': {
          height: '100%',
        },
        '.cm-content': {
          padding: '16px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: '14px',
          lineHeight: '1.6',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-scroller': {
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        },
        '.cm-gutters': {
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f8fafc',
          borderRight: theme === 'dark' ? '1px solid #374151' : '1px solid #e2e8f0',
          '&.cm-gutters': {
            backgroundColor: theme === 'dark' ? '#1f2937 !important' : '#f8fafc !important',
            borderRight: theme === 'dark' ? '1px solid #374151 !important' : '1px solid #e2e8f0 !important',
          }
        },
        '.cm-lineNumbers .cm-gutterElement': {
          color: theme === 'dark' ? '#9ca3af !important' : '#6b7280 !important',
        },
        '.cm-gutter.cm-lineNumbers': {
          color: theme === 'dark' ? '#9ca3af !important' : '#6b7280 !important',
        },
      })
    );

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [theme, effectiveTheme]); // Recreate when theme or effectiveTheme changes

  // Update content when it changes externally (e.g., from file loading)
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== content) {
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: content,
        },
      });
      viewRef.current.dispatch(transaction);
    }
  }, [content]);

  // Add global styles for gutters - more aggressive approach
  useEffect(() => {
    const styleId = 'codemirror-gutter-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const darkColor = effectiveTheme === 'dark' ? '#1f2937' : '#f8fafc';
    const darkBorder = effectiveTheme === 'dark' ? '#374151' : '#e2e8f0';
    const darkTextColor = effectiveTheme === 'dark' ? '#9ca3af' : '#6b7280';

    styleElement.textContent = `
      .cm-gutters {
        background-color: ${darkColor} !important;
        border-right: 1px solid ${darkBorder} !important;
      }
      .cm-gutters::before {
        background-color: ${darkColor} !important;
      }
      .cm-gutters * {
        background-color: ${darkColor} !important;
      }
      .cm-gutter {
        background-color: ${darkColor} !important;
      }
      .cm-gutter.cm-lineNumbers {
        background-color: ${darkColor} !important;
        color: ${darkTextColor} !important;
      }
      .cm-gutter.cm-foldGutter {
        background-color: ${darkColor} !important;
      }
      .cm-lineNumbers .cm-gutterElement {
        color: ${darkTextColor} !important;
        background-color: transparent !important;
      }
      div.cm-gutters {
        background-color: ${darkColor} !important;
        border-right: 1px solid ${darkBorder} !important;
      }
      .cm-editor .cm-gutters {
        background-color: ${darkColor} !important;
        border-right: 1px solid ${darkBorder} !important;
      }
      [class*="cm-gutters"] {
        background-color: ${darkColor} !important;
      }
    `;

    console.log(`Applied gutter styles for theme: ${theme} (effective: ${effectiveTheme})`, {
      backgroundColor: darkColor,
      borderColor: darkBorder,
      textColor: darkTextColor
    });

    // Additional direct DOM manipulation as fallback
    setTimeout(() => {
      const gutters = document.querySelectorAll('.cm-gutters');
      gutters.forEach(gutter => {
        (gutter as HTMLElement).style.setProperty('background-color', darkColor, 'important');
        (gutter as HTMLElement).style.setProperty('border-right', `1px solid ${darkBorder}`, 'important');
      });
    }, 100);
  }, [theme, effectiveTheme]);

  return (
    <div className={`flex-1 overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      <div
        ref={editorRef}
        className={`h-full bg-white dark:bg-gray-900 ${effectiveTheme === 'dark' ? 'cm-dark-gutters' : 'cm-light-gutters'}`}
      />
    </div>
  );
});