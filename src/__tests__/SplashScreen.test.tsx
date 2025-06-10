import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SplashScreen from '../components/SplashScreen/SplashScreen';

describe('SplashScreen', () => {
  it('renders the title', () => {
    render(<SplashScreen />);
    expect(screen.getByText(/Label Assistant/i)).toBeInTheDocument();
  });

  it('shows initializing text', () => {
    render(<SplashScreen />);
    expect(screen.getByText(/Initializing/i)).toBeInTheDocument();
  });
});
