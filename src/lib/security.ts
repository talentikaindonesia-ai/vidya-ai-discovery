// Security utilities for data protection and validation
import { toast } from "sonner";

// Input sanitization to prevent XSS attacks
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/&/g, '&amp;') // Escape ampersands
    .trim();
};

// Email validation with security considerations
export const validateEmail = (email: string): boolean => {
  if (!email || email.length === 0) return false;
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5322 limit
};

// Phone number validation
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || phone.length === 0) return true; // Optional field
  
  const phoneRegex = /^[\+]?[0-9\-\(\)\s]{8,20}$/;
  return phoneRegex.test(phone);
};

// Rate limiting for sensitive operations
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxAttempts) {
    toast.error("Terlalu banyak percobaan. Silakan coba lagi nanti.");
    return false;
  }
  
  current.count++;
  return true;
};

// Secure error handling that doesn't leak sensitive information
export const handleSecureError = (error: any, userMessage: string = "Terjadi kesalahan sistem") => {
  // Log the full error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Security Error:', error);
  }
  
  // Show generic message to user
  toast.error(userMessage);
};

// Data masking for sensitive information display
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.slice(0, 2) + '*'.repeat(Math.max(0, username.length - 2));
  return `${maskedUsername}@${domain}`;
};

export const maskPhoneNumber = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  
  return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
};

// Security headers for API requests
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
});

// Content Security Policy helper
export const generateCSPNonce = (): string => {
  return btoa(Math.random().toString()).slice(0, 16);
};

// Secure session management
export const clearSecureSession = () => {
  try {
    // Clear localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  } catch (error) {
    console.warn('Error clearing session:', error);
  }
};

// Audit logging helper for client-side security events
export const logSecurityEvent = async (event: string, details?: any) => {
  try {
    // Only log in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${event}:`, details);
    }
    
    // In production, you might want to send this to a monitoring service
    // await fetch('/api/audit-log', { method: 'POST', body: JSON.stringify({ event, details }) });
  } catch (error) {
    // Silent fail for audit logging
  }
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return { 
      isValid: false, 
      message: 'Password must contain uppercase, lowercase, number, and special character' 
    };
  }
  
  return { isValid: true, message: 'Password is strong' };
};