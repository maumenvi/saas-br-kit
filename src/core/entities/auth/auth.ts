export type Auth = {
  email: string;
  password: string;
  organizationId: string;
}

export type AuthenticatedInput<Input> = {
  auth: Auth;
  input: Input;
}
