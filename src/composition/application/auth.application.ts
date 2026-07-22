import type { AuthType } from '../../core/entities/auth/application/auth.authorize.ts';
import type { AuthComposition } from '../modules/auth/auth.composition.ts';

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
