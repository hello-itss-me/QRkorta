import { useState, useEffect, useCallback } from 'react';

export type HotkeyAction = 'toggleLevel1' | 'toggleLevel2';

export interface HotkeyMap {
  toggleLevel1: string;
  toggleLevel2: string;
}

const defaultHotkeys: HotkeyMap = {
  toggleLevel1: 'Alt+1',
  toggleLevel2: 'Alt+2',
};

// This is a simplified hook. A real implementation would handle more edge cases.
export const useHotkeys = () => {
  const [hotkeys, setHotkeys] = useState<HotkeyMap>(defaultHotkeys);

  // In a real app, you'd load saved hotkeys from localStorage
  useEffect(() => {
    // const savedHotkeys = localStorage.getItem('app-hotkeys');
    // if (savedHotkeys) {
    //   setHotkeys(JSON.parse(savedHotkeys));
    // }
  }, []);

  const updateHotkey = useCallback((action: HotkeyAction, key: string) => {
    setHotkeys(prev => {
      const newHotkeys = { ...prev, [action]: key };
      // localStorage.setItem('app-hotkeys', JSON.stringify(newHotkeys));
      return newHotkeys;
    });
  }, []);

  return { hotkeys, updateHotkey };
};
