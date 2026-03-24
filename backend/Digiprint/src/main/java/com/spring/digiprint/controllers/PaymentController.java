package com.spring.digiprint.controllers;

import com.spring.digiprint.configurations.PaymentConfiguration;
import com.spring.digiprint.dtos.requests.PaymentRequestDTO;
import com.spring.digiprint.dtos.responses.PaymentResponseDTO;
import com.spring.digiprint.entities.*;
import com.spring.digiprint.enums.*;
import com.spring.digiprint.repositories.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/payment")
@RestController
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @PostMapping("/vnpay/create")
    public ResponseEntity<PaymentResponseDTO> createVnpayPayment(
            @Valid @RequestBody PaymentRequestDTO request,
            HttpServletRequest httpRequest
    ) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getOrderStatus() != OrderStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment can only be created when order status is COMPLETED"
            );
        }

        String txnRef = PaymentConfiguration.getRandomNumber(8);
        String orderInfo = request.getOrderInfo() != null && !request.getOrderInfo().isBlank()
                ? request.getOrderInfo().trim()
                : "Thanh toan don hang #" + order.getOrderId();
        String locale = request.getLocale() != null && !request.getLocale().isBlank()
                ? request.getLocale().trim()
                : "vn";
        String bankCode = request.getBankCode() != null && !request.getBankCode().isBlank()
                ? request.getBankCode().trim()
                : null;

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", PaymentConfiguration.vnp_Version);
        vnpParams.put("vnp_Command", PaymentConfiguration.vnp_Command);
        vnpParams.put("vnp_TmnCode", PaymentConfiguration.vnp_TmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(request.getAmount() * 100L));
        vnpParams.put("vnp_CurrCode", "VND");
        if (bankCode != null) {
            vnpParams.put("vnp_BankCode", bankCode);
        }
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", locale);
        vnpParams.put("vnp_ReturnUrl", PaymentConfiguration.vnp_ReturnUrl);
        vnpParams.put("vnp_IpAddr", PaymentConfiguration.getIpAddress(httpRequest));

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        vnpParams.put("vnp_CreateDate", formatter.format(cld.getTime()));
        cld.add(Calendar.MINUTE, 15);
        vnpParams.put("vnp_ExpireDate", formatter.format(cld.getTime()));

        String queryUrl = buildQuery(vnpParams);
        String secureHash = PaymentConfiguration.hmacSHA512(
                PaymentConfiguration.vnp_HashSecret,
                buildHashData(vnpParams)
        );
        String paymentUrl = PaymentConfiguration.vnp_PayUrl + "?" + queryUrl + "&vnp_SecureHash=" + secureHash;

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setTxnRef(txnRef);
        payment.setAmount(request.getAmount());
        payment.setBankCode(bankCode);
        payment.setOrderInfo(orderInfo);
        payment.setPaymentUrl(paymentUrl);
        payment.setPaymentStatus(PaymentStatus.PENDING);
        payment = paymentRepository.save(payment);

        return ResponseEntity.ok(new PaymentResponseDTO(payment));
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<PaymentResponseDTO> vnpayReturn(@RequestParam Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing vnp_TxnRef");
        }

        Payment payment = paymentRepository.findByTxnRef(txnRef)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        String vnpSecureHash = params.get("vnp_SecureHash");
        if (vnpSecureHash == null || vnpSecureHash.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing vnp_SecureHash");
        }

        Map<String, String> hashParams = new HashMap<>(params);
        hashParams.remove("vnp_SecureHash");
        hashParams.remove("vnp_SecureHashType");
        String expected = PaymentConfiguration.hmacSHA512(PaymentConfiguration.vnp_HashSecret, buildHashData(hashParams));
        if (!expected.equalsIgnoreCase(vnpSecureHash)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid VNPay signature");
        }

        String responseCode = params.get("vnp_ResponseCode");
        String txnStatus = params.get("vnp_TransactionStatus");
        payment.setVnpResponseCode(responseCode);
        payment.setVnpTransactionStatus(txnStatus);
        payment.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        payment.setRawCallbackPayload(params.toString());

        boolean success = "00".equals(responseCode) && "00".equals(txnStatus);
        payment.setPaymentStatus(success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
        if (success && payment.getPaidAt() == null) {
            payment.setPaidAt(LocalDateTime.now());
        }

        payment = paymentRepository.save(payment);
        return ResponseEntity.ok(new PaymentResponseDTO(payment));
    }

    private static String buildHashData(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);
            if (fieldValue == null || fieldValue.isBlank()) continue;

            if (hashData.length() > 0) {
                hashData.append('&');
            }

            hashData.append(fieldName)
                    .append('=')
                    .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
        }

        return hashData.toString();
    }

    private static String buildQuery(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder query = new StringBuilder();
        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);
            if (fieldValue == null || fieldValue.isBlank()) {
                continue;
            }
            if (query.length() > 0) {
                query.append('&');
            }
            query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8));
            query.append('=');
            query.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
        }
        return query.toString();
    }
}
