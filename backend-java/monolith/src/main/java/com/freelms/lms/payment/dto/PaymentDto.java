package com.freelms.lms.payment.dto;

import com.freelms.lms.common.enums.PaymentGateway;
import com.freelms.lms.common.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {
    private Long id;
    private Long userId;
    private Long courseId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private PaymentGateway paymentGateway;
    private String transactionId;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
