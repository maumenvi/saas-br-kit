import type { UserRepositoryPort } from '../user.repositories.ts';
import type { UserStatusPolicyPort } from '../policies/user.status.police.ts';
import type { UserValidationQueryPort } from '../user.validation.query.port.ts';

export class UserDataValidationService<Status> implements UserValidationQueryPort {
  private readonly userRepository: Pick<UserRepositoryPort<Status, unknown>, 'findById'>;
  private readonly userStatusPolicy: UserStatusPolicyPort<Status>;

  constructor(
    userRepository: Pick<UserRepositoryPort<Status, unknown>, 'findById'>,
    userStatusPolicy: UserStatusPolicyPort<Status>
  ) {
    this.userRepository = userRepository;
    this.userStatusPolicy = userStatusPolicy;
  }

  async findById(id: string): Promise<{
    id: string;
    enabled: boolean;
    emailVerified: boolean;
  } | null> {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    return {
      id: user.id,
      enabled: this.userStatusPolicy.isEnabled(user.status),
      emailVerified: user.emailVerified,
    };
  }
}
