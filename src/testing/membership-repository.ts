import type { Membership, MembershipRepositoryPort, OrganizationId } from "../core/index.ts";

export type InMemoryMembershipRepository = MembershipRepositoryPort &
  Readonly<{
    entries: readonly Membership[];
    clear(): void;
  }>;

/**
 * Stores memberships in memory for deterministic repository tests.
 */
export class InMemoryMembershipRepositoryAdapter implements InMemoryMembershipRepository {
  readonly #memberships = new Map<string, Membership>();

  /** Returns an immutable snapshot of stored memberships. */
  get entries(): readonly Membership[] {
    return Object.freeze(this.list());
  }

  /**
   * Removes all memberships from the repository.
   */
  clear(): void {
    this.#memberships.clear();
  }

  /**
   * Stores or replaces one membership by id.
   */
  async save(membership: Membership): Promise<void> {
    this.#memberships.set(membership.id, membership);
  }

  /**
   * Finds one membership by id.
   */
  async findById(membershipId: string): Promise<Membership | null> {
    return this.#memberships.get(membershipId) ?? null;
  }

  /**
   * Finds one membership for a user inside an organization.
   */
  async findByOrganizationIdAndUserId(
    input: Readonly<{ organizationId: OrganizationId; userId: string }>,
  ): Promise<Membership | null> {
    return (
      this.list().find(
        (membership) =>
          membership.organizationId === input.organizationId && membership.userId === input.userId,
      ) ?? null
    );
  }

  /**
   * Lists all memberships attached to a user.
   */
  async listByUserId(userId: string): Promise<readonly Membership[]> {
    return Object.freeze(this.list().filter((membership) => membership.userId === userId));
  }

  /**
   * Lists all memberships attached to an organization.
   */
  async listByOrganizationId(organizationId: OrganizationId): Promise<readonly Membership[]> {
    return Object.freeze(
      this.list().filter((membership) => membership.organizationId === organizationId),
    );
  }

  private list(): Membership[] {
    return [...this.#memberships.values()];
  }
}

export function createInMemoryMembershipRepository(): InMemoryMembershipRepository {
  return Object.freeze(new InMemoryMembershipRepositoryAdapter());
}
