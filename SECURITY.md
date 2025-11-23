# Security Policy

## Supported Versions

Currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Refresh token rotation
- Password hashing with bcrypt (10 rounds)
- Role-Based Access Control (RBAC)
- Session management

### Data Protection
- HTTPS/TLS encryption in transit
- Database encryption at rest (PostgreSQL)
- Sensitive data masking in logs
- Secure environment variable management
- CORS configuration

### API Security
- Rate limiting (10 requests per minute per IP)
- Input validation and sanitization
- SQL injection prevention (TypeORM parameterized queries)
- XSS prevention (Content Security Policy)
- CSRF protection
- Helmet.js security headers

### File Upload Security
- File type validation
- File size limits (100MB max)
- Virus scanning (recommended)
- Secure file storage (MinIO/S3)
- Signed URLs for downloads

### Dependency Security
- Regular dependency updates
- Automated vulnerability scanning
- NPM audit checks
- Dependabot integration

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: security@freelms.org

You should receive a response within 48 hours. If the issue is confirmed, we will:

1. Acknowledge receipt of your vulnerability report
2. Investigate and validate the vulnerability
3. Develop and test a fix
4. Release a security patch
5. Publicly disclose the vulnerability

## Security Best Practices for Deployment

### Environment Variables
- Never commit `.env` files
- Use strong, random secrets for JWT_SECRET
- Rotate secrets regularly
- Use environment-specific configurations

### Database Security
- Use strong database passwords
- Enable SSL/TLS for database connections
- Regular backups
- Limit database access by IP
- Use read-only users where possible

### Docker Security
- Use official base images
- Run containers as non-root user
- Scan images for vulnerabilities
- Keep images updated
- Use Docker secrets for sensitive data

### Network Security
- Use firewall rules
- Enable HTTPS only
- Use VPN for internal services
- Implement DDoS protection
- Monitor for suspicious activity

### Logging & Monitoring
- Log all authentication attempts
- Monitor for unusual patterns
- Set up alerts for security events
- Regular security audits
- Penetration testing

## Compliance

This project aims to comply with:

- GDPR (General Data Protection Regulation)
- OWASP Top 10 security standards
- SOC 2 Type II (in progress)

## Security Updates

Subscribe to security announcements:
- Watch this repository
- Follow @freelms_security on Twitter
- Join our security mailing list

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged (with permission) in our security advisories.

---

Last Updated: 2024-01-01
