import type { AuthContext } from '../../context/auth.context.ts';

export type AuthenticatedInput<Input> = {
  auth: AuthContext;
  input: Input;
}
