import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock firebase/auth at the module level — intercepts the real Firebase calls
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (u: object | null) => void) => {
    // Immediately resolve with a mock signed-in user
    setTimeout(() => callback({ uid: 'test-uid', email: 'test@example.com', displayName: 'Test User', photoURL: null }), 0);
    return vi.fn(); // unsubscribe noop
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn().mockResolvedValue({}),
  signInWithRedirect: vi.fn().mockResolvedValue({}),
}));

// Mock the entire firebase module to avoid initialization and network calls
vi.mock('../firebase', () => ({
  auth: {},
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  },
  googleProvider: {},
}));

// Mock Firestore functions from the SDK
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn((_docRef, callback) => {
    // Simulate initial data push so App doesn't stay in loading state
    setTimeout(() => {
      callback({
        exists: () => true,
        data: () => ({ attendance: 1000, weather: { temp: 20 } }),
        docs: []
      });
    }, 0);
    return vi.fn(); // unsubscribe noop
  }),
  setDoc: vi.fn().mockResolvedValue({}),
  updateDoc: vi.fn().mockResolvedValue({}),
}));

// Mock tab components to keep tests lightweight
vi.mock('./components/tabs/CommandCenter', () => ({
  default: () => <div data-testid="command-center">Command Center</div>,
}));
vi.mock('./components/tabs/Emergency', () => ({
  default: () => <div>Emergency Tab</div>,
}));
vi.mock('./components/tabs/Analytics', () => ({
  default: () => <div>Analytics Tab</div>,
}));
vi.mock('./components/tabs/Heatmaps', () => ({
  default: () => <div>Heatmaps Tab</div>,
}));
vi.mock('./components/tabs/Staffing', () => ({
  default: () => <div>Staffing Tab</div>,
}));
vi.mock('./components/AIAssistant', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>AI Panel</div> : null,
}));

import App from './App';

describe('App Component', () => {
  it('renders the Command Center after auth resolves', async () => {
    render(<App />);
    // Wait for auth state to resolve (setTimeout(0) in mock)
    const el = await screen.findByTestId('command-center', {}, { timeout: 3000 });
    expect(el).toBeInTheDocument();
  });

  it('renders the Open AI Assistant button', async () => {
    render(<App />);
    const btn = await screen.findByLabelText(/Open AI Assistant/i, {}, { timeout: 3000 });
    expect(btn).toBeInTheDocument();
  });
});
