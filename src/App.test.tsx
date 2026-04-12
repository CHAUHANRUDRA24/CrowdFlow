import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the Dashboard tab by default', () => {
    render(<App />);
    // Check if the main dashboard elements are present
    expect(screen.getAllByText(/Command Center/i).length).toBeGreaterThan(0);
  });

  it('renders the AI Assistant button', () => {
    render(<App />);
    expect(screen.getByLabelText(/Open AI Assistant/i)).toBeInTheDocument();
  });
});
