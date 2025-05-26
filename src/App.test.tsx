import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';
import { useAuthenticator } from '@aws-amplify/ui-react';

// Mock the AWS Amplify hooks and client
vi.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: vi.fn(),
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Heading: ({ children }: any) => <h2>{children}</h2>,
  View: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      Event: {
        observeQuery: () => ({
          subscribe: ({ next }: any) => {
            next({
              items: [
                {
                  id: '1',
                  title: 'Test Event',
                  description: 'A test event',
                  startDateTime: new Date().toISOString(),
                  endDateTime: new Date().toISOString(),
                  location: 'Test Location',
                  capacity: 100,
                  availableSpots: 50,
                  price: 10.0,
                  category: { name: 'Concert' },
                  isActive: true,
                },
              ],
            });
            return { unsubscribe: () => {} };
          },
        }),
        create: vi.fn(),
        delete: vi.fn(),
      },
      Category: {
        observeQuery: () => ({
          subscribe: ({ next }: any) => {
            next({
              items: [
                {
                  id: '1',
                  name: 'Concert',
                  description: 'Live music events',
                  color: '#FF0000',
                },
                {
                  id: '2',
                  name: 'Opera',
                  description: 'Classical opera performances',
                  color: '#00FF00',
                },
              ],
            });
            return { unsubscribe: () => {} };
          },
        }),
      },
      Booking: {
        create: vi.fn(),
        observeQuery: () => ({
          subscribe: ({ next }: any) => {
            next({ items: [] });
            return { unsubscribe: () => {} };
          },
        }),
      },
    },
  }),
}));

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows sign in button for non-authenticated users', () => {
    (useAuthenticator as any).mockReturnValue({
      user: null,
      signIn: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Sign In to Create Events')).toBeInTheDocument();
  });

  it('shows welcome message for authenticated users', () => {
    (useAuthenticator as any).mockReturnValue({
      user: { signInDetails: { loginId: 'testuser@example.com' } },
      signOut: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Welcome, testuser@example.com!')).toBeInTheDocument();
  });

  it('displays available events for all users', () => {
    (useAuthenticator as any).mockReturnValue({
      user: null,
      signIn: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('50 spots available')).toBeInTheDocument();
  });

  it('shows event creation button for authenticated users', () => {
    (useAuthenticator as any).mockReturnValue({
      user: { signInDetails: { loginId: 'testuser@example.com' } },
      signOut: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Create New Event')).toBeInTheDocument();
  });

  it('displays event categories', () => {
    (useAuthenticator as any).mockReturnValue({
      user: null,
      signIn: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Concert')).toBeInTheDocument();
    expect(screen.getByText('Opera')).toBeInTheDocument();
  });
});