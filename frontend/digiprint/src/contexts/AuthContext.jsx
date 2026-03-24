import { createContext } from "react";
import { useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

function readStoredAuth() {
    try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        if (storedUser && storedToken) {
            return { user: JSON.parse(storedUser), token: storedToken };
        }
    } catch {
        /* ignore */
    }
    return { user: null, token: null };
}

export function AuthProvider({ children }) {
    const initial = readStoredAuth();
    const [user, setUser] = useState(() => initial.user);
    const [token, setToken] = useState(() => initial.token);

    useEffect(() => {
        const next = readStoredAuth();
        setUser(next.user);
        setToken(next.token);
    }, []);

    useEffect(() => {
        const onSessionExpired = () => {
            setUser(null);
            setToken(null);
        };
        window.addEventListener("auth:session-expired", onSessionExpired);
        return () => window.removeEventListener("auth:session-expired", onSessionExpired);
    }, []);

    const login = (userData, token) => {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);

        setUser(userData);
        setToken(token);
    }

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        setUser(null);
        setToken(null);
    }

    /** Bổ sung field từ /me (userId, accountId, username profile, role…) mà không cần đăng nhập lại. */
    const mergeUser = useCallback((partial) => {
        setUser((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            for (const [k, v] of Object.entries(partial)) {
                if (v !== undefined && v !== null) {
                    next[k] = v;
                }
            }
            localStorage.setItem("user", JSON.stringify(next));
            return next;
        });
    }, []);

    /** USER không được: chỉ ARTIST / ADMIN quản lý work & commission. */
    const canManageWorks = !!user && (user.role === "ARTIST" || user.role === "ADMIN");
    const canManageCommissions = canManageWorks;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                mergeUser,
                isAuthenticated: !!user,
                canManageWorks,
                canManageCommissions,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);