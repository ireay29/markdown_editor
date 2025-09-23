import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

// Mock useUIStore
const mockUIStore = {
  theme: 'system' as const,
  setTheme: vi.fn(),
};

vi.mock('../store/uiStore', () => ({
  useUIStore: () => mockUIStore,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockUIStore.theme = 'system';
    
    // Reset matchMedia mock
    mockMatchMedia.mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('initializes with system theme by default', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('system');
    expect(result.current.systemTheme).toBe('light');
    expect(result.current.effectiveTheme).toBe('light');
  });

  it('detects dark system theme', () => {
    // Mock system dark theme
    mockMatchMedia.mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)' ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useTheme());
    
    expect(result.current.systemTheme).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
  });

  it('uses explicit theme when not system', () => {
    mockUIStore.theme = 'dark';
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
  });

  it('toggles theme correctly from system', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(mockUIStore.setTheme).toHaveBeenCalledWith('light');
  });

  it('toggles theme correctly from light to dark', () => {
    mockUIStore.theme = 'light';
    
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(mockUIStore.setTheme).toHaveBeenCalledWith('dark');
  });

  it('toggles theme correctly from dark to system', () => {
    mockUIStore.theme = 'dark';
    
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(mockUIStore.setTheme).toHaveBeenCalledWith('system');
  });

  it('saves theme to localStorage', () => {
    mockUIStore.theme = 'dark';
    
    renderHook(() => useTheme());
    
    // The hook should save the theme to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('loads theme from localStorage on init', () => {
    localStorageMock.setItem('theme', 'light');
    
    renderHook(() => useTheme());
    
    // Should call setTheme with stored value if it differs from current
    expect(mockUIStore.setTheme).toHaveBeenCalledWith('light');
  });

  it('applies theme to document element', () => {
    mockUIStore.theme = 'dark';
    
    renderHook(() => useTheme());
    
    // Should add 'dark' class to document root
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class for light theme', () => {
    // First set dark
    document.documentElement.classList.add('dark');
    mockUIStore.theme = 'light';
    
    renderHook(() => useTheme());
    
    // Should remove 'dark' class
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('listens to system theme changes', () => {
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();
    
    mockMatchMedia.mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderHook(() => useTheme());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    
    // Cleanup should remove the listener
    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});