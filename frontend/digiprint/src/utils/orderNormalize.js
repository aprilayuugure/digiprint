/** Chuẩn hóa so sánh trạng thái (API có thể trả IN_PROGRESS / IN PROGRESS). */
export function normalizeOrderStatus(s) {
    return String(s ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
}

/**
 * Mọi commission item đều có ít nhất một file delivered — khớp rule backend khi COMPLETED.
 * @param {object | null | undefined} order
 */
/**
 * Người đặt (customer) của đơn — so khớp accountId hoặc username.
 * @param {object | null} user — từ AuthContext (accountId, username)
 * @param {object | null} order — đã normalizeOrder
 */
export function isOrderCustomer(user, order) {
    if (!user || !order) return false;
    const acc = user.accountId ?? user.account_id;
    const custId = order.customerAccountId;
    if (acc != null && custId != null && Number(acc) === Number(custId)) return true;
    const u = String(user.username ?? "").trim().toLowerCase();
    const c = String(order.customerUsername ?? "").trim().toLowerCase();
    return Boolean(u && c && u === c);
}

export function orderHasAllCompletedDeliverables(order) {
    if (!order) return false;
    const items = order.orderItems ?? order.order_items ?? [];
    if (!Array.isArray(items) || items.length === 0) return false;
    return items.every((it) => {
        const d = it.completedDeliverables ?? it.completed_deliverables;
        return Array.isArray(d) && d.length > 0;
    });
}

/**
 * Chuẩn hóa payload Order từ API (camelCase / snake_case / alias `price`).
 * Nếu thiếu totalPrice nhưng có orderItems + lineTotal, cộng dòng để hiển thị.
 * @param {object | null | undefined} raw
 * @returns {object | null}
 */
export function normalizeOrder(raw) {
    if (raw == null || typeof raw !== "object") return raw ?? null;

    const itemsRaw = raw.orderItems ?? raw.order_items ?? [];
    const items = Array.isArray(itemsRaw)
        ? itemsRaw.map((it) => ({
              ...it,
              completedDeliverables:
                  it.completedDeliverables ?? it.completed_deliverables ?? [],
              commissionArtistUsername:
                  it.commissionArtistUsername ?? it.commission_artist_username ?? null,
          }))
        : [];

    const totalRaw =
        raw.totalPrice ??
        raw.total_price ??
        raw.price ??
        raw.orderPrice ??
        raw.order_price;

    let totalNum = Number(totalRaw);
    if (!Number.isFinite(totalNum) || totalNum === 0) {
        if (Array.isArray(items) && items.length > 0) {
            const sum = items.reduce((s, it) => {
                const lt =
                    it.lineTotal ??
                    it.line_total ??
                    (it.unitPrice != null && it.quantity != null
                        ? Number(it.unitPrice) * Number(it.quantity)
                        : null);
                const n = Number(lt);
                return s + (Number.isFinite(n) ? n : 0);
            }, 0);
            if (sum > 0) totalNum = sum;
        }
    }
    const totalPrice = Number.isFinite(totalNum) ? totalNum : 0;

    const nested = raw.customer ?? raw.customerAccount;
    const customerUsername =
        raw.customerUsername ??
        raw.customer_username ??
        raw.customerName ??
        raw.customer_name ??
        (nested && typeof nested === "object" ? nested.username ?? nested.email : null);

    const resolvedCustomer =
        customerUsername != null && String(customerUsername).trim() !== ""
            ? customerUsername
            : raw.customerUsername ?? raw.customer_username ?? nested?.email ?? null;

    const artistSummary =
        raw.artistSummary ?? raw.artist_summary ?? null;

    const customerAccountId =
        raw.customerAccountId ?? raw.customer_account_id ?? nested?.accountId ?? null;

    return {
        ...raw,
        orderItems: items,
        totalPrice,
        customerUsername: resolvedCustomer,
        customerAccountId,
        artistSummary,
        paymentStatus: raw.paymentStatus ?? raw.payment_status ?? null,
    };
}
