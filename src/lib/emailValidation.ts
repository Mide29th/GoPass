/**
 * Email Validation Utility
 * Validates email addresses using SMTP verification
 */

export interface EmailValidationResult {
  valid: boolean;
  email: string;
  reason?: string;
  suggestion?: string;
}

/**
 * Validate email using Abstract API Email Validation
 * Free tier: 100 requests/month
 * https://www.abstractapi.com/email-verification-validation-api
 */
export async function validateEmailWithAbstractAPI(
  email: string,
  apiKey: string
): Promise<EmailValidationResult> {
  try {
    const response = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      console.error('Abstract API error:', response.status);
      return {
        valid: true, // Fail open - don't block signup if validation service is down
        email,
        reason: 'Validation service unavailable',
      };
    }

    const data = await response.json();
    
    // Abstract API response structure:
    // {
    //   email: "example@domain.com",
    //   autocorrect: "",
    //   deliverability: "DELIVERABLE" | "UNDELIVERABLE" | "RISKY" | "UNKNOWN",
    //   quality_score: 0.99,
    //   is_valid_format: { value: true },
    //   is_free_email: { value: false },
    //   is_disposable_email: { value: false },
    //   is_role_email: { value: false },
    //   is_catchall_email: { value: false },
    //   is_mx_found: { value: true },
    //   is_smtp_valid: { value: true }
    // }

    console.log('📧 Email validation result:', {
      email: data.email,
      deliverability: data.deliverability,
      is_smtp_valid: data.is_smtp_valid?.value,
      quality_score: data.quality_score,
    });

    // Check if email is deliverable
    const isDeliverable = data.deliverability === 'DELIVERABLE';
    const isValidFormat = data.is_valid_format?.value !== false;
    const isSmtpValid = data.is_smtp_valid?.value !== false;
    const isMxFound = data.is_mx_found?.value !== false;

    // Reject disposable/temporary email addresses
    if (data.is_disposable_email?.value === true) {
      return {
        valid: false,
        email,
        reason: 'Disposable email addresses are not allowed. Please use a permanent email address.',
      };
    }

    // Check if email is valid
    if (!isValidFormat) {
      return {
        valid: false,
        email,
        reason: 'Invalid email format',
        suggestion: data.autocorrect || undefined,
      };
    }

    if (!isMxFound) {
      return {
        valid: false,
        email,
        reason: 'Email domain does not exist or has no mail server configured',
      };
    }

    if (!isSmtpValid) {
      return {
        valid: false,
        email,
        reason: 'Email address does not exist on the mail server',
      };
    }

    if (!isDeliverable) {
      return {
        valid: false,
        email,
        reason: data.deliverability === 'RISKY' 
          ? 'Email address appears to be risky or unreliable' 
          : 'Email address cannot receive emails',
      };
    }

    // Email is valid
    return {
      valid: true,
      email,
      suggestion: data.autocorrect || undefined,
    };
  } catch (error) {
    console.error('Email validation error:', error);
    // Fail open - don't block signup if validation fails
    return {
      valid: true,
      email,
      reason: 'Validation service error',
    };
  }
}

/**
 * Validate email using ZeroBounce API (alternative)
 * Free tier: 100 credits
 * https://www.zerobounce.net/
 */
export async function validateEmailWithZeroBounce(
  email: string,
  apiKey: string
): Promise<EmailValidationResult> {
  try {
    const response = await fetch(
      `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      console.error('ZeroBounce API error:', response.status);
      return {
        valid: true,
        email,
        reason: 'Validation service unavailable',
      };
    }

    const data = await response.json();
    
    console.log('📧 Email validation result (ZeroBounce):', {
      email: data.address,
      status: data.status,
      sub_status: data.sub_status,
    });

    // ZeroBounce statuses: valid, invalid, catch-all, unknown, spamtrap, abuse, do_not_mail
    const isValid = data.status === 'valid';
    const isDisposable = data.sub_status === 'disposable';

    if (isDisposable) {
      return {
        valid: false,
        email,
        reason: 'Disposable email addresses are not allowed. Please use a permanent email address.',
      };
    }

    if (!isValid) {
      return {
        valid: false,
        email,
        reason: `Email validation failed: ${data.status}`,
      };
    }

    return {
      valid: true,
      email,
    };
  } catch (error) {
    console.error('Email validation error:', error);
    return {
      valid: true,
      email,
      reason: 'Validation service error',
    };
  }
}

/**
 * Basic email format validation (fallback)
 */
export function validateEmailFormat(email: string): EmailValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      email,
      reason: 'Invalid email format',
    };
  }

  // Check for common typos in popular domains
  const commonDomains = {
    'gmail.com': ['gmai.com', 'gmial.com', 'gmal.com', 'gmail.co'],
    'yahoo.com': ['yahooo.com', 'yaho.com', 'yahoo.co'],
    'outlook.com': ['outlok.com', 'outloo.com', 'outlook.co'],
    'hotmail.com': ['hotmal.com', 'hotmai.com', 'hotmail.co'],
  };

  const domain = email.split('@')[1]?.toLowerCase();
  
  for (const [correctDomain, typos] of Object.entries(commonDomains)) {
    if (typos.includes(domain)) {
      return {
        valid: false,
        email,
        reason: `Did you mean ${email.split('@')[0]}@${correctDomain}?`,
        suggestion: `${email.split('@')[0]}@${correctDomain}`,
      };
    }
  }

  return {
    valid: true,
    email,
  };
}

/**
 * Main email validation function
 * Choose which validation method to use based on environment
 */
export async function validateEmail(
  email: string,
  options?: {
    apiKey?: string;
    provider?: 'abstract' | 'zerobounce' | 'basic';
  }
): Promise<EmailValidationResult> {
  // First, do basic format validation
  const formatCheck = validateEmailFormat(email);
  if (!formatCheck.valid) {
    return formatCheck;
  }

  // If no API key provided, only do format validation
  if (!options?.apiKey) {
    console.log('⚠️ No email validation API key provided, using basic validation only');
    return formatCheck;
  }

  // Use specified provider or default to Abstract API
  const provider = options.provider || 'abstract';

  if (provider === 'zerobounce') {
    return validateEmailWithZeroBounce(email, options.apiKey);
  } else if (provider === 'abstract') {
    return validateEmailWithAbstractAPI(email, options.apiKey);
  } else {
    return formatCheck;
  }
}
