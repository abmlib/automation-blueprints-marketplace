# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Automation Blueprints Marketplace seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do NOT:

- Open a public GitHub issue
- Disclose the vulnerability publicly before we've had a chance to address it
- Exploit the vulnerability beyond what is necessary to demonstrate it

### Please DO:

1. **Email** our security team at: **security@abmlib.dev**
2. **Include** the following information:
   - Type of vulnerability
   - Affected package(s) and version(s)
   - Step-by-step instructions to reproduce
   - Proof of concept (if possible)
   - Potential impact
   - Suggested fix (if you have one)

### What to Expect:

- **24-48 hours**: Initial response acknowledging your report
- **7 days**: Preliminary assessment and severity classification
- **30 days**: Target timeline for patch release (may vary based on complexity)
- **Recognition**: Credit in the CHANGELOG and security advisory (if desired)

## Security Best Practices

When using Automation Blueprints SDK:

### For Blueprint Authors:

✅ **DO:**
- Validate all user input
- Use environment variables for sensitive data
- Follow principle of least privilege
- Keep dependencies updated
- Test blueprints in sandbox environments

❌ **DON'T:**
- Hard-code API keys or secrets in blueprints
- Include personally identifiable information (PII) in examples
- Use untrusted data without validation
- Bypass security features

### For SDK Users:

✅ **DO:**
- Keep packages updated: `npm update`
- Use latest versions of `@automation-blueprints/dsl` and `@automation-blueprints/adapters`
- Implement proper error handling
- Validate blueprints before execution
- Use secure credential storage

❌ **DON'T:**
- Execute untrusted blueprints without validation
- Disable security checks
- Expose validation endpoints publicly without rate limiting

## Known Security Considerations

### Blueprint Execution

Blueprints are JSON configurations and should not execute arbitrary code. However:

- **Template Injection**: Be cautious with user-provided template variables
- **SSRF Risks**: Validate URLs in webhook triggers
- **Data Exposure**: Review blueprints for sensitive data before publishing

### API Integration

- **Rate Limiting**: Implement rate limiting on validation endpoints
- **Input Validation**: Always validate blueprint JSON against schema
- **Size Limits**: Enforce reasonable size limits on blueprint files

## Security Updates

Subscribe to security updates:

- Watch this repository for security advisories
- Subscribe to our security mailing list: security-announce@abmlib.dev

## Vulnerability Disclosure Policy

- We follow **coordinated disclosure**
- We aim for 30-90 day disclosure timeline depending on severity
- We will credit researchers who report responsibly
- We may offer recognition in our security hall of fame

## Compliance

For enterprise customers requiring compliance validation:

- HIPAA compliance features available in enterprise tier
- GDPR/CCPA data privacy validation available in enterprise tier
- SOC2-ready audit logs available in enterprise tier

Contact: enterprise@abmlib.dev

---

**Last Updated:** October 7, 2025  
**Version:** 1.0

