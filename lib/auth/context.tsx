'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/data/types';
import { db } from '@/lib/data';
import { can as canHelper, PermissionAction, PermissionContext } from './permissions';
import { useI18n } from '@/lib/i18n/context';

interface AuthContextType {
  currentUser: User | null; // null represents Guest Donor
  isGuest: boolean;
  featuredPersonas: User[];
  allUsers: User[];
  switchUser: (userId: string | null) => void;
  can: (action: PermissionAction, ctxOverrides?: Partial<Omit<PermissionContext, 'state'>>) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isGuest: false,
  featuredPersonas: [],
  allUsers: [],
  switchUser: () => {},
  can: () => false,
});

const ACTIVE_USER_STORAGE_KEY = 'motherboard_active_user_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLocale } = useI18n();
  const [activeUserId, setActiveUserId] = useState<string | null>('usr_maria');
  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (saved !== null) {
      setActiveUserId(saved === 'guest' ? null : saved);
    }
  }, []);

  const allUsers = db.users.list();
  const featuredPersonas = db.users.listFeaturedPersonas();
  const currentUser = activeUserId ? allUsers.find((u) => u.id === activeUserId) ?? null : null;

  const switchUser = (userId: string | null) => {
    setActiveUserId(userId);
    if (userId === null) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, 'guest');
    } else {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId);
      const targetUser = allUsers.find((u) => u.id === userId);
      if (targetUser?.locale) {
        setLocale(targetUser.locale);
      }
    }
  };

  const can = (action: PermissionAction, ctxOverrides?: Partial<Omit<PermissionContext, 'state'>>): boolean => {
    const state = db.getStateSnapshot();
    const fullCtx: PermissionContext = {
      state,
      ...ctxOverrides,
    };
    return canHelper(currentUser, action, fullCtx);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isGuest: currentUser === null,
        featuredPersonas,
        allUsers,
        switchUser,
        can,
      }}
    >
      {/* key dbVersion to trigger clean re-renders on mutations */}
      <div key={dbVersion} className="contents">
        {children}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
