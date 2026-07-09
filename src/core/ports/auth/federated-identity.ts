export type VerifiedFederatedIdentity = Readonly<{
  providerId: string;
  issuer: string;
  subject: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
}>;
