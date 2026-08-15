import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tukana-ai-visited-pages';

export const useFirstVisit = (pageKey: string) => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    try {
      const visited = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!visited[pageKey]) {
        setIsFirstVisit(true);
      }
    } catch {
      setIsFirstVisit(true);
    }
  }, [pageKey]);

  const dismissGuide = () => {
    setIsFirstVisit(false);
    try {
      const visited = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      visited[pageKey] = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visited));
    } catch {}
  };

  return { isFirstVisit, dismissGuide };
};
