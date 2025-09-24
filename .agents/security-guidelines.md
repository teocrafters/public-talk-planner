# Security Guidelines

Comprehensive security standards and best practices for the Public Talk Planner project.

## Input Validation and Sanitization

### Client-Side Validation

- ALWAYS VALIDATE user inputs on both client and server sides
- USE `Zod` v4 schemas for comprehensive input validation
- SANITIZE user inputs before processing or storage
- ESCAPE output to prevent XSS attacks

#### Validation Rules

- USE string length limits for all text inputs
- APPLY regex patterns for format validation
- IMPLEMENT array size limits to prevent abuse
- VALIDATE email format with proper regex
- SANITIZE HTML content with allowedTags restrictions
- RESTRICT allowedAttributes in HTML sanitization

### Server-Side Security

- VALIDATE all inputs at API boundaries
- USE parameterized queries to prevent SQL injection
- IMPLEMENT proper error handling without exposing internal details

#### Database Security

- VALIDATE ID formats before executing queries
- USE Drizzle ORM parameterized queries exclusively
- IMPLEMENT request limits to prevent abuse
- APPLY `WHERE` clauses for proper authorization
- USE SQLite prepared statements for security
- VALIDATE foreign key references before operations

## Authentication and Authorization

### BetterAuth Integration Security

- USE secure token storage and transmission
- IMPLEMENT proper session management with database-backed sessions
- VALIDATE sessions on every protected request
- HANDLE session expiration gracefully

#### Authentication Checks

- VERIFY user exists in database
- VALIDATE session token authenticity and expiration
- CHECK session validity against database records
- HANDLE authentication errors with appropriate status codes
- VALIDATE user email verification status

### Role-Based Authorization

- IMPLEMENT hierarchical role system
- CHECK permissions before allowing operations
- USE role hierarchy for permission inheritance

#### Authorization Patterns

- DEFINE role hierarchy with numeric values
- IMPLEMENT role checking functions
- VALIDATE user permissions before operations
- RETURN appropriate error codes for insufficient permissions

### Session Security

- USE secure cookie settings
- IMPLEMENT proper session timeout
- REGENERATE session IDs after authentication
- CLEAR sessions on logout

#### Session Configuration

- SET `httpOnly` flag to prevent XSS
- USE `secure` flag in production environment
- APPLY `sameSite` strict policy
- CONFIGURE appropriate maxAge values
- SET correct domain and path parameters

#### Session Management

- GENERATE cryptographically secure session IDs
- STORE session data with expiration timestamps
- VALIDATE sessions on each request
- EXTEND sessions when user is active
- CLEAN UP expired sessions regularly

## Data Protection

### Sensitive Data Handling

- NEVER LOG sensitive information
- ENCRYPT sensitive data at rest
- USE environment variables for secrets
- IMPLEMENT data retention policies

#### Logging Security

- REDACT passwords from all logs
- REDACT tokens, secrets, and keys from logs
- REDACT email addresses from logs
- USE structured logging with sanitized metadata
- LOG user actions with safe identifiers only

### Environment Variables Security

- STORE secrets in secure environment variables
- USE different secrets for different environments
- ROTATE secrets regularly
- VALIDATE required environment variables on startup

#### Environment Validation

- USE `Zod` schemas for environment variable validation
- ENFORCE minimum secret lengths (32+ characters)
- VALIDATE URLs and token formats
- HANDLE optional variables appropriately
- VALIDATE BetterAuth secret configuration
- ENSURE database connection strings are secure

## API Security

### Rate Limiting

- IMPLEMENT rate limiting on API endpoints
- USE different limits for different operations
- PROTECT against brute force attacks
- MONITOR for abuse patterns

#### Rate Limiting Strategy

- CONFIGURE per-endpoint limits
- IMPLEMENT sliding window counters
- TRACK by IP and user identifier
- RETURN reset timestamps in responses
- CLEAN UP old entries automatically

### CORS and Security Headers

- CONFIGURE CORS properly for your domain
- SET security headers to prevent attacks
- USE Content Security Policy (CSP)
- IMPLEMENT HTTPS redirect

#### Security Headers

- SET X-Content-Type-Options to nosniff
- SET X-Frame-Options to DENY
- SET X-XSS-Protection with mode block
- SET Referrer-Policy to strict-origin-when-cross-origin
- CONFIGURE Permissions-Policy restrictions
- USE HSTS in production environment
- IMPLEMENT comprehensive CSP policies

## Error Handling Security

### Safe Error Responses

- NEVER EXPOSE internal system details in error messages
- LOG detailed errors internally only
- RETURN generic error messages to clients
- USE consistent error response format

#### Error Handling Patterns

- CREATE custom error classes with internal details
- LOG comprehensive error information internally
- RETURN sanitized error messages to clients
- USE consistent HTTP status codes

## File Upload Security

### Secure File Handling

- VALIDATE file types and sizes
- SCAN uploaded files for malware
- STORE files outside web root
- USE secure file naming

#### File Validation

- CHECK MIME types against allowlist
- VALIDATE file size limits
- VERIFY file content with magic number checks
- GENERATE secure random filenames
- SANITIZE original filenames

#### Upload Security

- UPLOAD to secure cloud storage
- RECORD uploads in database
- VALIDATE file content integrity
- IMPLEMENT virus scanning where possible

## Security Monitoring

### Audit Logging

- LOG all security-relevant events
- MONITOR for suspicious patterns
- ALERT on security incidents
- RETAIN logs for compliance

#### Security Events

- TRACK authentication attempts (success/failure)
- TRACK authorization failures
- TRACK suspicious activities and patterns
- TRACK database operations with user context
- TRACK session creation and destruction
- INCLUDE user ID, IP address, user agent
- INCLUDE timestamp and event details
- LOG session token validation failures

#### Monitoring Strategy

- USE structured logging format
- IMPLEMENT severity levels (low/medium/high/critical)
- SEND alerts for high-severity events
- STORE events for analysis and reporting
- MAINTAIN audit trails for compliance

## Regular Security Practices

### Security Checklist

- UPDATE dependencies regularly
- RUN automated security scans
- INCLUDE security focus in code reviews
- PERFORM regular penetration testing
- TEST backup and recovery procedures
- REVIEW user permissions regularly
- MONITOR security logs for anomalies
- MAINTAIN incident response procedures

### NuxtHub Deployment Security

- SEPARATE dev/staging/production secrets
- CONFIGURE Cloudflare security settings properly
- USE Cloudflare Workers security features
- IMPLEMENT proper D1 database access controls
- MONITOR NuxtHub deployment security
- CONFIGURE environment-specific bindings
- USE Wrangler secrets for sensitive data
- VALIDATE Cloudflare KV access patterns
