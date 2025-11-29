package com.freelms.lms.payment.service;

import com.freelms.lms.common.dto.PagedResponse;
import com.freelms.lms.common.enums.PaymentStatus;
import com.freelms.lms.common.exception.BadRequestException;
import com.freelms.lms.common.exception.ResourceNotFoundException;
import com.freelms.lms.payment.dto.CreatePaymentRequest;
import com.freelms.lms.payment.dto.PaymentDto;
import com.freelms.lms.payment.entity.Payment;
import com.freelms.lms.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Transactional
    public PaymentDto createPayment(Long userId, CreatePaymentRequest request) {
        log.info("Creating payment for user {} course {}", userId, request.getCourseId());

        if (paymentRepository.existsByUserIdAndCourseIdAndStatus(userId, request.getCourseId(), PaymentStatus.COMPLETED)) {
            throw new BadRequestException("Payment already completed for this course");
        }

        Payment payment = Payment.builder()
                .userId(userId)
                .courseId(request.getCourseId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .paymentGateway(request.getPaymentGateway())
                .status(PaymentStatus.PENDING)
                .build();

        payment = paymentRepository.save(payment);
        log.info("Payment created with ID: {}", payment.getId());

        return toDto(payment);
    }

    @Transactional
    public PaymentDto completePayment(Long paymentId, String transactionId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new BadRequestException("Payment is not in pending status");
        }

        payment.complete(transactionId != null ? transactionId : UUID.randomUUID().toString());
        payment = paymentRepository.save(payment);

        log.info("Payment completed: {}", paymentId);
        return toDto(payment);
    }

    @Transactional
    public PaymentDto failPayment(Long paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        payment.fail(reason);
        payment = paymentRepository.save(payment);

        log.info("Payment failed: {} - {}", paymentId, reason);
        return toDto(payment);
    }

    @Transactional
    public PaymentDto refundPayment(Long paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new BadRequestException("Only completed payments can be refunded");
        }

        payment.refund(reason);
        payment = paymentRepository.save(payment);

        log.info("Payment refunded: {} - {}", paymentId, reason);
        return toDto(payment);
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
        return toDto(payment);
    }

    @Transactional(readOnly = true)
    public PagedResponse<PaymentDto> getUserPayments(Long userId, Pageable pageable) {
        Page<Payment> payments = paymentRepository.findByUserId(userId, pageable);
        List<PaymentDto> dtos = payments.getContent().stream().map(this::toDto).toList();
        return PagedResponse.of(payments, dtos);
    }

    @Transactional(readOnly = true)
    public boolean hasCompletedPayment(Long userId, Long courseId) {
        return paymentRepository.existsByUserIdAndCourseIdAndStatus(userId, courseId, PaymentStatus.COMPLETED);
    }

    private PaymentDto toDto(Payment payment) {
        return PaymentDto.builder()
                .id(payment.getId())
                .userId(payment.getUserId())
                .courseId(payment.getCourseId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paymentGateway(payment.getPaymentGateway())
                .transactionId(payment.getTransactionId())
                .processedAt(payment.getProcessedAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
