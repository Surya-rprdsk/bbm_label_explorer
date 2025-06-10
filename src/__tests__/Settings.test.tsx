import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from '../components/Settings/Settings';

describe('Settings', () => {
  it('renders Settings header', () => {
    render(<Settings />);
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(<Settings />);
    // The Save button is only visible when the 'URLs' section is active
    const urlsButton = screen.getByText(/URLs/i);
    fireEvent.click(urlsButton);
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
  });
});
