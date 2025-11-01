# Password Reset Feature

## Overview
Secure password reset functionality with email verification and token-based authentication.

## Security Features

1. **Token-based Reset**: Uses cryptographically secure random tokens (32 bytes)
2. **Token Hashing**: Tokens are hashed with SHA-256 before storage
3. **Time Expiration**: Reset links expire after 1 hour
4. **SessionStorage Validation**: Additional client-side validation prevents token manipulation
5. **Email Verification**: Only registered emails can request password resets
6. **Generic Responses**: Doesn't reveal if email exists in database

## User Flow

1. User clicks "Forgot Password?" on sign-in page
2. User enters their email address
3. System sends reset link to email (if account exists)
4. User clicks link in email
5. System validates token and email
6. User enters new password (with confirmation)
7. Password is updated and user redirected to sign-in

## API Endpoints

### POST `/api/auth/forgot-password`
Request password reset link
```json
{
  "email": "user@example.com"
}
```

### POST `/api/auth/verify-reset-token`
Verify if reset token is valid
```json
{
  "token": "reset_token",
  "email": "user@example.com"
}
```

### POST `/api/auth/reset-password`
Reset password with valid token
```json
{
  "token": "reset_token",
  "email": "user@example.com",
  "password": "newpassword123"
}
```

## Environment Variables

Add to `.env`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to production URL in production
NODE_EMAIL=your-email@gmail.com
NODE_PASS=your-app-password
```

## Database Schema Updates

Added to User model:
- `resetPasswordToken`: String (hashed token)
- `resetPasswordExpires`: Date (expiration timestamp)

## Pages

- `/forgot-password` - Request password reset
- `/reset-password?token=xxx&email=xxx` - Reset password form

## Testing

1. Start development server
2. Navigate to `/sign-in`
3. Click "Forgot Password?"
4. Enter registered email
5. Check email for reset link
6. Click link and enter new password
7. Sign in with new password
