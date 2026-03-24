import { useCallback, useReducer } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import CommissionService from "../services/CommissionService";
import { commissionInitialState, CommissionReducer } from "../reducers/CommissionReducer";
import { VALID_GENRES } from "../constants/validGenres";

/**
 * @param {object} [options]
 * @param {number | null | undefined} [options.ownerUserId] — Nếu có (trang artist), chỉ load commission của user này.
 */
export function useCommission(options = {}) {
    const { ownerUserId } = options;
    const { user } = useAuthContext();
    const [state, dispatch] = useReducer(CommissionReducer, commissionInitialState);

    const setFilters = useCallback((partial) => {
        dispatch({ type: "SET_FILTERS", payload: partial });
    }, []);

    const toOptionalInt = (v) => {
        if (v === "" || v === null || v === undefined) return undefined;
        const n = parseInt(String(v), 10);
        return Number.isNaN(n) ? undefined : n;
    };

    const fetchCommissions = useCallback(async () => {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "CLEAR_ERRORS" });

        try {
            const f = state.filters;
            let commissions = [];

            if (ownerUserId != null) {
                const res = await CommissionService.getByUser(ownerUserId);
                commissions = res.data ?? [];
            } else if (f.genre) {
                const res = await CommissionService.getByGenre(f.genre);
                commissions = res.data ?? [];
            } else {
                const resList = await Promise.all(
                    (VALID_GENRES || []).map((g) => CommissionService.getByGenre(g))
                );
                commissions = resList.flatMap((r) => r.data ?? []);
            }

            const min = toOptionalInt(f.priceMin);
            const max = toOptionalInt(f.priceMax);
            if (min != null) commissions = commissions.filter((c) => Number(c.commissionPrice) >= min);
            if (max != null) commissions = commissions.filter((c) => Number(c.commissionPrice) <= max);

            // For USER role, show only commissions belonging to him.
            if (user?.role === "USER") {
                const userId = user?.userId ?? user?.accountId;
                if (userId == null) {
                    commissions = [];
                } else {
                    commissions = commissions.filter((c) => c.userId === userId);
                }
            }

            dispatch({ type: "SET_COMMISSIONS", payload: commissions });
        } catch (err) {
            dispatch({
                type: "SET_ERRORS",
                payload: err.response?.data?.general
                    ? err.response.data
                    : { general: err.response?.data?.message || "Failed to load commissions" },
            });
        }
    }, [state.filters, user, ownerUserId]);

    const addCommission = useCallback(
        async ({
            commissionType,
            commissionPrice,
            commissionDescription,
            genre,
            userId,
            /** Mỗi phần tử có { file: File } — upload sau khi tạo commission (chỉ lưu commissions/id/...) */
            attachmentFiles,
        }) => {
            const body = {
                commissionType,
                commissionPrice: Math.trunc(Number(commissionPrice)),
                commissionDescription: commissionDescription ?? "",
                genre,
                userId,
            };
            let commissionId;
            try {
                const res = await CommissionService.addCommission(body);
                commissionId = res.data?.commissionId;
                if (commissionId == null) {
                    throw new Error("No commissionId in response");
                }
                const list = attachmentFiles ?? [];
                for (const item of list) {
                    if (item?.file) {
                        await CommissionService.uploadCommissionAttachment(commissionId, item.file, genre);
                    }
                }
            } catch (e) {
                if (commissionId != null) {
                    try {
                        await CommissionService.deleteCommission(commissionId);
                    } catch {
                        /* ignore rollback errors */
                    }
                }
                throw e;
            }
            await fetchCommissions();
        },
        [fetchCommissions]
    );

    return {
        state,
        setFilters,
        fetchCommissions,
        addCommission,
    };
}

