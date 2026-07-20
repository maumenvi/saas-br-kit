import type { Payload, TokenPort } from '../../../ports/token.port.ts';
import type { MembershipRepositoryPort } from '../../membership/membership.repositories.ts';
import type { Membership } from '../../membership/membership.ts';
import type { AuthPort } from '../auth.port.ts';
import type { AuthInputMap } from '../auth.ts';
import { AuthErrors } from '../domain/auth.errors.ts';

export const AUTH_TYPES = [
  'LOGIN',
  'CREDENTIALS',
  'OAUTH',
  'API_KEY',
  'CUSTOM',
] as const;

export type AuthType = (typeof AUTH_TYPES)[number];
export type AuthServices<CustomAuth = Record<string, unknown>> = {
  [Type in AuthType]?: AuthPort<AuthInputMap<CustomAuth>[Type]>;
};

export type AuthUseCaseInput<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> = {
  services: AuthServices<CustomAuth>;
  type: Type;
  tokenPort: TokenPort<Output>;
  membershipRepository: Pick<
    MembershipRepositoryPort<MembershipStatus, MembershipExtra>,
    'findByActorOrganizationId'
  >;
};

export type ExecuteAuthUseCaseInput<AuthenticationInput> = {
  authenticated: AuthenticationInput;
  payload: Payload;
  config: unknown;
};

export type AuthOutput<Output, MembershipStatus, MembershipExtra = unknown> = {
  token: Output;
  membership: Membership<MembershipStatus, MembershipExtra>;
};

export class AuthUseCase<
  Output,
  Type extends AuthType = 'LOGIN',
  CustomAuth = Record<string, unknown>,
  MembershipStatus = unknown,
  MembershipExtra = unknown,
> {
  private readonly services: AuthServices<CustomAuth>;
  private readonly type: Type;
  private readonly tokenPort: TokenPort<Output>;
  private readonly membershipRepository: Pick<
    MembershipRepositoryPort<MembershipStatus, MembershipExtra>,
    'findByActorOrganizationId'
  >;

  constructor(input: AuthUseCaseInput<Output, Type, CustomAuth, MembershipStatus, MembershipExtra>) {
    this.services = input.services;
    this.type = input.type;
    this.tokenPort = input.tokenPort;
    this.membershipRepository = input.membershipRepository;
  }

  async execute(
    input: ExecuteAuthUseCaseInput<AuthInputMap<CustomAuth>[Type]>,
  ): Promise<AuthOutput<Output, MembershipStatus, MembershipExtra>> {
    const { authenticated, payload, config } = input;
    const service = this.resolveAuthService();

    const actor = await service.authenticate(authenticated);
    if (!actor) {
      throw AuthErrors.authFailed();
    }

    const membership = await this.membershipRepository.findByActorOrganizationId(
      actor.actorId,
      payload.organizationId,
    );
    if (!membership) {
      throw AuthErrors.unauthorized();
    }

    const token = await this.tokenPort.createToken({
      ...payload,
      actorId: actor.actorId,
      actorType: actor.actorType,
      organizationId: membership.organizationId,
    }, config);

    return { token, membership };
  }

  private resolveAuthService(): AuthPort<AuthInputMap<CustomAuth>[Type]> {
    const service = this.services[this.type] as
      | AuthPort<AuthInputMap<CustomAuth>[Type]>
      | undefined;

    if (!service) {
      throw AuthErrors.invalidType();
    }

    return service;
  }
}
