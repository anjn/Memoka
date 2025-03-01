/**
 * @file App component tests
 * @AI-CONTEXT This file contains tests for the App component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the child components to simplify testing
jest.mock('./components/Layout', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mock-layout">{children}</div>
    ),
  };
});

jest.mock('./components/Editor', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="mock-editor">Editor Content</div>,
  };
});

describe('App Component', () => {
  it('renders the Layout and Editor components', () => {
    render(<App />);
    
    // Check if Layout is rendered
    const layoutElement = screen.getByTestId('mock-layout');
    expect(layoutElement).toBeInTheDocument();
    
    // Check if Editor is rendered within Layout
    const editorElement = screen.getByTestId('mock-editor');
    expect(editorElement).toBeInTheDocument();
    expect(layoutElement).toContainElement(editorElement);
  });
});
