package com.freelms.lms.payment.dto;

import com.freelms.lms.common.enums.PaymentGateway;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
    private BigDecimal amount;

    @Builder.Default
    private String currency = "USD";

    @Builder.Default
    private PaymentGateway paymentGateway = PaymentGateway.STRIPE;
}
