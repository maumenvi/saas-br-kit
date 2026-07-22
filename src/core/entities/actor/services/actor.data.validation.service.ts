import type { ActorRepositoryPort } from '../actor.repositories.ts';
import type { ActorStatusPolicyPort } from '../policies/actor.status.police.ts';
import type { ActorValidationQueryPort } from '../actor.validation.query.port.ts';

export class ActorDataValidationService<Status> implements ActorValidationQueryPort {
  private readonly actorRepository: Pick<ActorRepositoryPort<Status, unknown>, 'findById'>;
  private readonly actorStatusPolicy: ActorStatusPolicyPort<Status>;

  constructor(
    actorRepository: Pick<ActorRepositoryPort<Status, unknown>, 'findById'>,
    actorStatusPolicy: ActorStatusPolicyPort<Status>
  ) {
    this.actorRepository = actorRepository;
    this.actorStatusPolicy = actorStatusPolicy;
  }

  async findById(id: string) {
    const actor = await this.actorRepository.findById(id);
    if (!actor) return null;
    return {
      id: actor.id,
      type: actor.type,
      enabled: this.actorStatusPolicy.isEnabled(actor.status),
      ...(actor.type === 'USER'
        ? {
            emailVerified: actor.emailVerified,
            telephoneVerified: actor.telephoneVerified,
            email: actor.email.value,
            telephone: actor.telephone.value,
          }
        : {}),
    };
  }
}
