/**
 * @file Code Block Extension for TipTap
 * @AI-CONTEXT This file contains the code block extension with syntax highlighting for the TipTap editor
 */

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

// Create a lowlight instance with common languages
const lowlight = createLowlight(common);

// Import CSS for syntax highlighting
import 'highlight.js/styles/github.css';

/**
 * Code block extension with syntax highlighting
 */
export const CodeBlockExtension = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: 'javascript',
});

/**
 * Available languages for code blocks
 */
export const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'css', label: 'CSS' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
];
