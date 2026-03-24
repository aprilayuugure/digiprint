import api from "../api/axiosInstance";

const PaymentService = {
    createVnpayPayment: (body) =>
        api.post("/payment/vnpay/create", body, { skipSuccessToast: true }),

    confirmVnpayReturn: (params) =>
        api.get("/payment/vnpay/return", {
            params,
            skipSuccessToast: true,
        }),
};

export default PaymentService;
