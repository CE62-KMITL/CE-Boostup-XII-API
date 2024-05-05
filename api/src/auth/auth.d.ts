export interface JWTPayload {
  sub: string;
  email: string;
}

export interface JWTPayloadCreateAccount extends JWTPayload {
  createAccount: boolean;
}

export interface JWTPayloadResetPassword extends JWTPayload {
  resetPassword: boolean;
}
