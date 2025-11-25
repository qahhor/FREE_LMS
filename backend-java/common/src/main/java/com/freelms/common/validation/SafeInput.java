package com.freelms.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Custom validation annotation for safe input handling.
 * Prevents XSS, SQL injection, and other malicious input.
 */
@Documented
@Constraint(validatedBy = SafeInputValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeInput {

    String message() default "Input contains potentially dangerous content";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    /**
     * Maximum allowed length
     */
    int maxLength() default 10000;

    /**
     * Allow HTML tags (default: false)
     */
    boolean allowHtml() default false;

    /**
     * Allow special characters like <, >, &, etc. (default: false for strict mode)
     */
    boolean allowSpecialChars() default true;
}
