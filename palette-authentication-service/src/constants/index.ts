export const Errors = {
  INVALID_AUTH_TOKEN: 'Invalid or expired auth token',
  PASSWORDS_MISMATCH_ERROR: 'Invalid old password',
  ACCOUNT_SUSPENDED: 'Account is suspended',
  EMAIL_ADDRESS_NOT_FOUND: 'Email address not found',
  USER_NOT_FOUND: 'User not found',
  NOT_REGISTERED_ERROR: 'User is not registered on Palette',
  PRE_REGISTERED_ERROR: 'User is already registered on Palette',
  INVALID_PASSWORD: 'Invalid password',
  FERPA_NOT_ACCEPTED:
    'User does not agree with FERPA guidelines. Cant proceed with pre registration',
  MALFORMED_REQUEST: 'Malformed request, invalid data',
  INVALID_OTP: 'Invalid Otp',
  OTP_EXPIRED: 'OTP has expired',
};

export const Responses = {
  LOGIN_SUCCESS: 'Login successful',
  PASSWORD_RESET_SUCCESS: 'Password changed successfully',
  PRE_REGISTER_SUCCESS: 'User pre registered successfully',
  ADD_PROFILE_PICTURE_SUCCESS: 'Profile picture updated successfully',
  OTP_SENT_SUCCESS:
    'OTP has been sent to your registered email and mobile number',
  USER_REGISTERED_SUCCESS: 'User is registered on Palette',
  USERS_FOUND_SUCCESS: 'User exists on Palette',
  OTP_VALIDATION_SUCCESS: 'Otp validated',
};

export const EnvKeys = {
  PASSWORD_HASHING_KEY: "$2b$10$yDjv.HvX6K5mY.9ZPYAs5O",
}

export const AccountRecordType = {
  ACTIVITY: 'Activity',
  EDUCATIONAL_INSTITUTION: 'Educational Institution',
  // ACTIVITY: 'activities',
}
