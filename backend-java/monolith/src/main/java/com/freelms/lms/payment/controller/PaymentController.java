package com.freelms.lms.payment.controller;

import com.freelms.lms.common.dto.ApiResponse;
import com.freelms.lms.common.dto.PagedResponse;
import com.freelms.lms.common.security.CurrentUser;
import com.freelms.lms.common.security.UserPrincipal;
import com.freelms.lms.payment.dto.CreatePaymentRequest;
import com.freelms.lms.payment.dto.PaymentDto;
import com.freelms.lms.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @Operation(summary = "Create a payment")
    public ResponseEntity<ApiResponse<PaymentDto>> createPayment(
            @CurrentUser UserPrincipal userPrincipal,
            @Valid @RequestBody CreatePaymentRequest request) {
        PaymentDto payment = paymentService.createPayment(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(payment, "Payment created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentById(@PathVariable Long id) {
        PaymentDto payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my payments")
    public ResponseEntity<ApiResponse<PagedResponse<PaymentDto>>> getMyPayments(
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<PaymentDto> payments = paymentService.getUserPayments(userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Complete a payment (Admin)")
    public ResponseEntity<ApiResponse<PaymentDto>> completePayment(
            @PathVariable Long id,
            @RequestParam(required = false) String transactionId) {
        PaymentDto payment = paymentService.completePayment(id, transactionId);
        return ResponseEntity.ok(ApiResponse.success(payment, "Payment completed successfully"));
    }

    @PostMapping("/{id}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Refund a payment (Admin)")
    public ResponseEntity<ApiResponse<PaymentDto>> refundPayment(
            @PathVariable Long id,
            @RequestParam String reason) {
        PaymentDto payment = paymentService.refundPayment(id, reason);
        return ResponseEntity.ok(ApiResponse.success(payment, "Payment refunded successfully"));
    }
}
