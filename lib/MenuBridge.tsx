import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MENU_KEY = 'mytwin-menu-visible';

interface MenuBridgeType {
  menuVisible: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const MenuBridgeContext = createContext<MenuBridgeType>({
  menuVisible: false,
  openMenu: () => {},
  closeMenu: () => {},
  toggleMenu: () => {},
});

export function MenuBridgeProvider({ children }: { children: React.ReactNode }) {
  const [menuVisible, setMenuVisible] = useState(false);

  const syncToStorage = useCallback(async (val: boolean) => {
    try {
      await AsyncStorage.setItem(MENU_KEY, val ? 'true' : 'false');
    } catch (e) {}
  }, []);

  const openMenu = useCallback(() => {
    setMenuVisible(true);
    syncToStorage(true);
  }, [syncToStorage]);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    syncToStorage(false);
  }, [syncToStorage]);

  const toggleMenu = useCallback(() => {
    setMenuVisible(prev => {
      const newVal = !prev;
      syncToStorage(newVal);
      return newVal;
    });
  }, [syncToStorage]);

  return (
    <MenuBridgeContext.Provider value={{ menuVisible, openMenu, closeMenu, toggleMenu }}>
      {children}
    </MenuBridgeContext.Provider>
  );
}

export function useMenuBridge() {
  return useContext(MenuBridgeContext);
}
