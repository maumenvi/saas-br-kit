export type CreateAccountInput = Readonly<{
  email: string;
  password: string;
  displayName?: string;
  organizationName: string;
  organizationSubdomain?: string;
  organizationUrl?: string;
  deviceId?: string;
}>;
