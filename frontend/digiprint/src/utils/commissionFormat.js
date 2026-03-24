/** Integer price for VN-style display (no decimals). */
export function formatCommissionPrice(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}
