# SpendSpace

## Email verification

Email/password registration uses Firebase Authentication's built-in verification link. Enable Email/Password under Firebase Authentication sign-in providers and configure the verification email template in the Firebase Console. Add the app's local and production domains to Authentication's authorized domains. Firebase sends the link after registration; the verification page can resend it and refresh the user's verification status. Google sign-in continues to use Firebase Authentication and does not need an additional verification step.
