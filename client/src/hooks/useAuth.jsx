/* src/hooks/useAuth.js */
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/http';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  // undefined: 正在加载   null: 未登录   object: 已登录
  const [user, setUser] = useState(undefined);

  // 应用启动时拉一次 /me
  useEffect(() => {
    api('/me')
      .then(setUser)
      .catch(() => setUser(null)); // 未登录或 401
  }, []);

  return (
    <AuthCtx.Provider value={{ user, setUser }}>
      {user === undefined ? (
        // 可以在这里放一个全局 loading
        <div className="h-screen flex items-center justify-center">
          Loading…
        </div>
      ) : (
        children
      )}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
