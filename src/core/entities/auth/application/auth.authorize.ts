import type { Payload, TokenPort } from '../../../ports/token.port.ts';
import type { MembershipRepositoryPort } from '../../membership/membership.repositories.ts';
import type { Membership } from '../../membership/membership.ts';
import type { ValidateMfaCodeInput, ValidateMfaCodeOutput } from '../../mfa/application/mfa.validate-code.input.ts';
import { MfaErrors } from '../../mfa/domain/mfa.errors.ts';
import type { MfaRepositoryPort } from '../../mfa/mfa.repositories.ts';
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
  mfaRepository: Pick<MfaRepositoryPort, 'findActiveByActorId'>;
  validateMfaCode: (
    input: ValidateMfaCodeInput,
  ) => Promise<ValidateMfaCodeOutput>;
};

export type ExecuteAuthUseCaseInput<AuthenticationInput> = {
  authenticated: AuthenticationInput;
  mfaCode?: string;
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
  private readonly mfaRepository: Pick<MfaRepositoryPort, 'findActiveByActorId'>;
  private readonly validateMfaCode: (
    input: ValidateMfaCodeInput,
  ) => Promise<ValidateMfaCodeOutput>;

  constructor(input: AuthUseCaseInput<Output, Type, CustomAuth, MembershipStatus, MembershipExtra>) {
    this.services = input.services;
    this.type = input.type;
    this.tokenPort = input.tokenPort;
    this.membershipRepository = input.membershipRepository;
    this.mfaRepository = input.mfaRepository;
    this.validateMfaCode = input.validateMfaCode;
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

    if (actor.actorType === 'USER') {
      const mfa = await this.mfaRepository.findActiveByActorId(actor.actorId);
      if (mfa) {
        if (!input.mfaCode?.trim()) throw MfaErrors.codeRequired();
        await this.validateMfaCode({
          actorId: actor.actorId,
          code: input.mfaCode,
        });
      }
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
