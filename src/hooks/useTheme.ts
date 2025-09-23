import { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore';

export const useTheme = () => {
  const { theme, setTheme } = useUIStore();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // システムテーマの監視
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    // 初期値を設定
    updateSystemTheme();

    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  // 実際に適用するテーマを計算
  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  // テーマをドキュメントのclass属性に反映
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [effectiveTheme]);

  // テーマをローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 初回ロード時のテーマ設定
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    
    if (storedTheme && storedTheme !== theme) {
      setTheme(storedTheme);
    } else if (!storedTheme) {
      setTheme('system');
    }
  }, [setTheme, theme]);

  const toggleTheme = () => {
    const currentTheme = theme;
    if (currentTheme === 'system') {
      setTheme('light');
    } else if (currentTheme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  return {
    theme,
    effectiveTheme,
    systemTheme,
    setTheme,
    toggleTheme,
  };
};