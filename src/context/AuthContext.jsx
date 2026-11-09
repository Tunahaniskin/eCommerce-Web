import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Api } from '../services/api';

const TOKEN_KEY = 'nexara_token';
const USER_KEY = 'nexara_user';
const BALANCE_KEY = 'nexara_balance';

const AuthContext = createContext(null);

function parseJwtPayload(token) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 > Date.now();
}

function getUserIdFromToken(token) {
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  return payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.nameid || payload.id || null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    return isTokenValid(savedToken) ? savedToken : null;
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      const savedToken = localStorage.getItem(TOKEN_KEY);
      return isTokenValid(savedToken) && savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [balance, setBalance] = useState(() => {
    try {
      const savedBalance = localStorage.getItem(BALANCE_KEY);
      return savedBalance !== null ? Number(savedBalance) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [walletTransactions, setWalletTransactions] = useState([]);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const isLoggedIn = !!(token && user && isTokenValid(token));

  const refreshBalance = useCallback(async (explicitUserId = null, explicitToken = null) => {
    const activeToken = explicitToken || token;
    if (!activeToken || !isTokenValid(activeToken)) {
      setBalance(0);
      setWalletTransactions([]);
      return 0;
    }

    const activeUserId = explicitUserId || user?.id || getUserIdFromToken(activeToken);
    try {
      setBalanceLoading(true);
      const walletData = await Api.getWallet(activeUserId, activeToken);
      const newBal = Number(walletData.balance) || 0;
      setBalance(newBal);
      setWalletTransactions(walletData.transactions || []);
      localStorage.setItem(BALANCE_KEY, String(newBal));
      return newBal;
    } catch (err) {
      console.warn('Cüzdan bilgisi alınamadı:', err);
      return 0;
    } finally {
      setBalanceLoading(false);
    }
  }, [token, user?.id]);

  const setSession = useCallback((data) => {
    const accessToken = data.accessToken || data.token;
    const extractedId = data.user?.id || data.id || getUserIdFromToken(accessToken);
    const userData = {
      ...(data.user || {}),
      id: extractedId,
      email: data.user?.email || data.email,
      firstName: data.user?.firstName || data.firstName || '',
      lastName: data.user?.lastName || data.lastName || ''
    };
    
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);

    // Refresh balance and profile immediately
    refreshBalance(extractedId, accessToken);

    // If name is missing, try fetching profile in background
    if (!userData.firstName) {
      Api.getProfile(accessToken).then((profile) => {
        if (profile && (profile.firstName || profile.lastName)) {
          const updated = {
            ...userData,
            firstName: profile.firstName || userData.firstName,
            lastName: profile.lastName || userData.lastName
          };
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
          setUser(updated);
        }
      }).catch(() => {});
    }
  }, [refreshBalance]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(BALANCE_KEY);
    setToken(null);
    setUser(null);
    setBalance(0);
    setWalletTransactions([]);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await Api.login(email, password);
    setSession(data);
    return data;
  }, [setSession]);

  const register = useCallback(async (formData) => {
    const res = await Api.register(formData);
    return res;
  }, []);

  const requestDeposit = useCallback(async (amount) => {
    if (!token) throw new Error('Oturum açmanız gerekiyor.');
    const result = await Api.requestDeposit(amount, token);
    await refreshBalance();
    return result;
  }, [token, refreshBalance]);

  // Initial balance load when user & token are present
  useEffect(() => {
    if (token && isTokenValid(token)) {
      refreshBalance();
    }
  }, [token, refreshBalance]);

  // Periodic expiration check
  useEffect(() => {
    if (!token) return;
    const checkExpiry = () => {
      if (!isTokenValid(token)) {
        logout();
      }
    };
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoggedIn,
        balance,
        walletTransactions,
        balanceLoading,
        refreshBalance,
        requestDeposit,
        login,
        register,
        logout,
        setSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
