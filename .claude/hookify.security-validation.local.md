---
name: security-validation
enabled: true
event: file
action: warn
pattern: (process\.env\.[A-Z_]+.*console\.log|API[_-]?KEY.*=\s*['""][^'"]+['"]|password.*=\s*['""][^'"]+['"]|\.env.*API|eval\(|dangerouslySetInnerHTML|innerHTML\s*=|\$\{.*\}.*query|concatenat.*user.*input.*(query|sql)|SELECT.*\+.*req\.|INSERT.*\+.*req\.)
---

⚠️ **Security Issue Detected**

Your code may contain a security vulnerability.

**Common security issues to check:**

1. **SQL Injection:**
   - Never concatenate user input into SQL queries
   - Use parameterized queries or ORM methods
   - Example: Use Drizzle's `.where(eq(...))` instead of string concatenation

2. **Exposed Secrets:**
   - Don't log environment variables containing secrets
   - Don't hardcode API keys or passwords in code
   - Use `.env` files and keep them in `.gitignore`

3. **XSS (Cross-Site Scripting):**
   - Avoid `eval()`, `innerHTML`, or `dangerouslySetInnerHTML`
   - Use framework-provided safe methods
   - Sanitize user input before rendering

4. **Unvalidated User Input:**
   - Always validate user input with Zod schemas
   - Check types, lengths, and formats
   - Never trust client-side data

**Recommended actions:**
- Review the code for security issues
- Use Zod validation for all user inputs
- Use parameterized queries for database operations
- Keep secrets in environment variables
- Consider using the security guidelines in `.agents/security-guidelines.md`

If you're confident this is safe, you can proceed, but please review carefully.
