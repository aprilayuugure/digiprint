import { useCallback, useMemo } from "react";

export function useOrdersPageConfig({
    userRole,
    artistOrderView,
    embedded,
    fetchOrders,
    isArtist,
}) {
    const isUserRole = userRole === "USER";
    const isAdmin = userRole === "ADMIN";
    const incomingView = artistOrderView === "incoming";
    const myPurchasesView = artistOrderView === "myPurchases";

    const showCustomerCol = useMemo(
        () => (isArtist && incomingView) || isAdmin,
        [isArtist, incomingView, isAdmin]
    );

    const showArtistCol = useMemo(
        () =>
            isUserRole ||
            (isArtist && myPurchasesView) ||
            (isArtist && !embedded && !incomingView),
        [isUserRole, isArtist, myPurchasesView, embedded, incomingView]
    );

    const showActionsIncoming = useMemo(
        () => (isArtist && incomingView) || (!embedded && isAdmin),
        [isArtist, incomingView, embedded, isAdmin]
    );

    const showActionsMyOrders = useMemo(
        () =>
            isUserRole ||
            (isArtist && (myPurchasesView || (!embedded && !incomingView))),
        [isUserRole, isArtist, myPurchasesView, embedded, incomingView]
    );

    const showActionsCol = showActionsIncoming || showActionsMyOrders;
    const showCustomerFilter = showActionsIncoming;
    const showArtistFilter = showActionsMyOrders;

    const tableColCount = useMemo(
        () =>
            1 +
            (showCustomerCol || showArtistCol ? 1 : 0) +
            5 +
            (showActionsCol ? 1 : 0),
        [showCustomerCol, showArtistCol, showActionsCol]
    );

    const title = useMemo(() => {
        if (isUserRole) return "My orders";
        if (incomingView) return "Orders";
        if (myPurchasesView || (!embedded && isArtist)) return "My orders";
        return "Orders";
    }, [isUserRole, incomingView, myPurchasesView, embedded, isArtist]);

    const description = useMemo(() => {
        if (isUserRole) return "Showing orders placed under your account.";
        if (incomingView) {
            return "Orders from customers who purchased at least one of your commissions.";
        }
        if (myPurchasesView || (!embedded && isArtist)) {
            return "Orders you placed as a customer (with other artists).";
        }
        return "Showing all orders (admin view).";
    }, [isUserRole, incomingView, myPurchasesView, embedded, isArtist]);

    const showPlaceOrder =
        isUserRole || (isArtist && (myPurchasesView || !embedded));

    const detailState = useMemo(() => {
        if (!embedded || !isArtist) return undefined;
        if (incomingView) return { artistTab: "orders" };
        if (myPurchasesView) return { artistTab: "myOrders" };
        return undefined;
    }, [embedded, isArtist, incomingView, myPurchasesView]);

    const refetchOrders = useCallback(
        (page = 0) => {
            if (incomingView && isArtist) {
                return fetchOrders(page, { artistOrderMode: "incoming" });
            }
            return fetchOrders(page, {});
        },
        [fetchOrders, incomingView, isArtist]
    );

    return {
        isUserRole,
        isAdmin,
        isArtist,
        incomingView,
        myPurchasesView,
        showCustomerCol,
        showArtistCol,
        showActionsIncoming,
        showActionsMyOrders,
        showActionsCol,
        showCustomerFilter,
        showArtistFilter,
        tableColCount,
        title,
        description,
        showPlaceOrder,
        detailState,
        refetchOrders,
    };
}

