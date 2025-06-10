// Jest setup file to mock Tauri event API for all import styles
jest.mock('@tauri-apps/api/event', () => ({
  __esModule: true,
  default: {
    listen: jest.fn(() => Promise.resolve(() => {})),
  },
  listen: jest.fn(() => Promise.resolve(() => {})),
}));
