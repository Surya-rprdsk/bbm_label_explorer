import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import App from '../App';

// Helper to set theme in localStorage and dispatch event
function setTheme(theme: string) {
  localStorage.setItem('settings_theme', theme);
  window.dispatchEvent(new StorageEvent('storage', { key: 'settings_theme', newValue: theme }));
}

describe('Dark mode toggle', () => {
  afterEach(() => {
    setTheme('light');
    cleanup();
    document.body.removeAttribute('data-theme');
    window.location.hash = '';
    window.location.pathname = '/';
  });

  it('should apply dark mode to all windows except splash screen', async () => {
    // Render main app (not splash, not settings)
    window.location.hash = '';
    window.location.pathname = '/';
    const { unmount } = render(<App />);

    // Find and click the dark mode toggle button
    const themeBtn = screen.getByRole('button', { name: /switch to dark mode/i });
    fireEvent.click(themeBtn);

    // Wait for theme to update
    await waitFor(() => {
      expect(document.body.getAttribute('data-theme')).toBe('dark');
    });

    // Settings window should also be dark
    unmount();
    window.location.pathname = '/settings.html';
    render(<App />);
    await waitFor(() => {
      expect(document.body.getAttribute('data-theme')).toBe('dark');
    });

    // Splash screen should NOT be dark (simulate splash hash)
    cleanup();
    window.location.hash = '#splash';
    window.location.pathname = '/';
    render(<App />);
    // Splash screen should not have dark theme
    expect(document.body.getAttribute('data-theme')).not.toBe('dark');
  });
});
