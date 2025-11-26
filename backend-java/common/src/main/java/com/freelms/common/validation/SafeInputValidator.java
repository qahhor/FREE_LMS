package com.freelms.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.web.util.HtmlUtils;

import java.util.regex.Pattern;

/**
 * Validator for @SafeInput annotation.
 * Sanitizes and validates user input to prevent security vulnerabilities.
 */
public class SafeInputValidator implements ConstraintValidator<SafeInput, String> {

    private int maxLength;
    private boolean allowHtml;
    private boolean allowSpecialChars;

    // Patterns for detecting potential attacks
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "('.+--)|(--)|(%27)|(;)|(/\\*)|(\\*/)|" +
        "(\\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\\b)",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern XSS_PATTERN = Pattern.compile(
        "(<script[^>]*>.*?</script>)|" +
        "(javascript:)|" +
        "(on\\w+\\s*=)|" +
        "(<iframe[^>]*>)|" +
        "(<object[^>]*>)|" +
        "(<embed[^>]*>)|" +
        "(<link[^>]*>)|" +
        "(<meta[^>]*>)",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    private static final Pattern PATH_TRAVERSAL_PATTERN = Pattern.compile(
        "(\\.\\./)|(\\.\\\\)|(%2e%2e%2f)|(%2e%2e/)|(%2e%2e%5c)",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void initialize(SafeInput constraintAnnotation) {
        this.maxLength = constraintAnnotation.maxLength();
        this.allowHtml = constraintAnnotation.allowHtml();
        this.allowSpecialChars = constraintAnnotation.allowSpecialChars();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true; // Use @NotBlank for required fields
        }

        // Check length
        if (value.length() > maxLength) {
            setMessage(context, "Input exceeds maximum length of " + maxLength);
            return false;
        }

        // Check for SQL injection patterns
        if (SQL_INJECTION_PATTERN.matcher(value).find()) {
            setMessage(context, "Input contains potentially dangerous SQL patterns");
            return false;
        }

        // Check for XSS patterns
        if (!allowHtml && XSS_PATTERN.matcher(value).find()) {
            setMessage(context, "Input contains potentially dangerous script content");
            return false;
        }

        // Check for path traversal
        if (PATH_TRAVERSAL_PATTERN.matcher(value).find()) {
            setMessage(context, "Input contains path traversal patterns");
            return false;
        }

        // Check for null bytes
        if (value.contains("\0")) {
            setMessage(context, "Input contains null bytes");
            return false;
        }

        return true;
    }

    private void setMessage(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }

    /**
     * Utility method to sanitize input (can be used separately)
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        // HTML escape
        String sanitized = HtmlUtils.htmlEscape(input);
        // Remove null bytes
        sanitized = sanitized.replace("\0", "");
        // Trim whitespace
        return sanitized.trim();
    }
}
