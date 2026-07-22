import type { AuthType } from '../../../core/entities/auth/application/auth.authorize.ts';
import { AuthComposition } from '../../modules/auth/auth.composition.ts';
import type { AuthCompositionInput } from '../../modules/auth/auth.composition.input.ts';

export type AuthApplication<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> = Pick<
  AuthComposition<
    Output,
    Type,
    CustomAuth,
    MembershipStatus,
    MembershipExtra
  >,
  'authenticate'
>;

export function createAuthApplication<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
>(
  input: AuthCompositionInput<
    Output,
    Type,
    CustomAuth,
    MembershipStatus,
    MembershipExtra
  >,
): AuthApplication<
  Output,
  Type,
  CustomAuth,
  MembershipStatus,
  MembershipExtra
> {
  const composition = new AuthComposition(input);

  return Object.freeze({ authenticate: composition.authenticate });
}
