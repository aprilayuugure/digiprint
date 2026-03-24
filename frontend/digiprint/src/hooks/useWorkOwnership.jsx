import { useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";

/**
 * Quyền sửa/xóa work trên thẻ (creator khớp user hoặc ADMIN).
 */
export function useWorkOwnership() {
    const { user, canManageWorks } = useAuthContext();

    const canManageWork = useCallback(
        (work) => {
            if (!canManageWorks || !user) return false;
            if (user.role === "ADMIN") return true;
            const u = user.username?.trim();
            const c = work?.creator?.trim();
            if (!u || !c) return false;
            return u.toLowerCase() === c.toLowerCase();
        },
        [canManageWorks, user]
    );

    return { canManageWork };
}
