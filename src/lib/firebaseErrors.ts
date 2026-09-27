/**
 * Friendly Firebase Authentication Error Formatter
 * Translates Firebase internal error codes into clear, actionable advice.
 */

export function getFriendlyAuthErrorMessage(err: unknown, context: 'login' | 'signup' | 'reset-password' | 'google' = 'login'): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  const rawMessage = err instanceof Error ? err.message : String(err);
  const code = (err && typeof err === 'object' && 'code' in err) 
    ? String((err as { code: unknown }).code) 
    : '';

  // 1. Operation not allowed or configuration not found (when auth isn't enabled in Firebase Console)
  if (
    code === 'auth/configuration-not-found' ||
    rawMessage.includes('auth/configuration-not-found') ||
    rawMessage.includes('configuration-not-found') ||
    code === 'auth/operation-not-allowed' ||
    rawMessage.includes('auth/operation-not-allowed') ||
    rawMessage.includes('operation-not-allowed')
  ) {
    if (context === 'google') {
      return "Google Sign-In is not enabled yet in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method, click 'Google', and toggle it to Enabled (with a project support email).";
    }
    if (context === 'reset-password') {
      return "Password reset cannot be sent because 'Email/Password' sign-in is disabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method, and enable 'Email/Password'.";
    }
    return "This sign-in method is not enabled in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method, and toggle 'Email/Password' and 'Google' to Enabled.";
  }

  // 2. Unauthorized domain (when deployed to Vercel / Netlify / custom domain)
  if (code === 'auth/unauthorized-domain' || rawMessage.includes('auth/unauthorized-domain') || rawMessage.includes('unauthorized-domain')) {
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
    return `Domain '${currentDomain}' is not authorized in Firebase Authentication. Please go to Firebase Console > Authentication > Settings > Authorized domains, and click 'Add domain' with '${currentDomain}'.`;
  }

  // 3. User credentials errors
  if (code === 'auth/user-not-found' || rawMessage.includes('user-not-found')) {
    if (context === 'reset-password') {
      return "No account exists with this email address. Please make sure you registered first.";
    }
    return "No account found with this email. Please check your spelling or sign up.";
  }

  if (code === 'auth/wrong-password' || rawMessage.includes('wrong-password') || code === 'auth/invalid-credential' || rawMessage.includes('invalid-credential')) {
    return "Incorrect email or password. Please verify and try again, or use 'Forgot password?'.";
  }

  // 4. Registration errors
  if (code === 'auth/email-already-in-use' || rawMessage.includes('email-already-in-use')) {
    return "An account with this email address already exists. Please sign in instead.";
  }

  if (code === 'auth/weak-password' || rawMessage.includes('weak-password')) {
    return "Password is too weak. Please use at least 6 characters including numbers or letters.";
  }

  if (code === 'auth/invalid-email' || rawMessage.includes('invalid-email')) {
    return "Please enter a valid email address.";
  }

  // 5. Popup & Google OAuth errors
  if (code === 'auth/popup-closed-by-user' || rawMessage.includes('popup-closed-by-user')) {
    return "Google Sign-In was cancelled before completing.";
  }

  if (code === 'auth/popup-blocked' || rawMessage.includes('popup-blocked')) {
    return "The sign-in popup was blocked by your browser. Please allow popups for this site or sign in using email.";
  }

  if (code === 'auth/cancelled-popup-request' || rawMessage.includes('cancelled-popup-request')) {
    return "Sign-in popup request was cancelled.";
  }

  // 6. Network & Throttling
  if (code === 'auth/network-request-failed' || rawMessage.includes('network-request-failed')) {
    return "Network error. Please check your internet connection and try again.";
  }

  if (code === 'auth/too-many-requests' || rawMessage.includes('too-many-requests')) {
    return "Too many unsuccessful attempts. Access has been temporarily paused for security. Please try again in a few minutes or reset your password.";
  }

  // Generic fallback without ugly raw stack
  if (rawMessage.startsWith('Firebase: Error (')) {
    return rawMessage.replace(/^Firebase: Error \(([^)]+)\)\.?/, '$1').replace(/-/g, ' ');
  }

  return rawMessage;
}
