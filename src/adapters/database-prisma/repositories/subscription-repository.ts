import type {
  FindSubscriptionByProviderSubscriptionIdInput,
  RepositoryOperationOptions,
  Subscription,
  SubscriptionRepositoryPort,
  SubscriptionWebhookRepositoryPort,
} from "#core";
import { prismaSubscriptionMapper } from "../mappers/index.ts";
import type { PrismaRepositoryContext } from "./context.ts";

/** Persists subscriptions through Prisma while implementing Core repository ports. */
export class PrismaSubscriptionRepository
  implements SubscriptionRepositoryPort, SubscriptionWebhookRepositoryPort
{
  private readonly context: PrismaRepositoryContext;

  /** Stores the repository context used to resolve transactions. */
  constructor(context: PrismaRepositoryContext) {
    this.context = context;
  }

  /** Saves a subscription by id using an upsert. */
  async save(subscription: Subscription, options?: RepositoryOperationOptions): Promise<void> {
    const data = prismaSubscriptionMapper.toPersistence(subscription);
    await this.context.getClient(options).subscription.upsert({
      where: { id: subscription.id },
      create: data,
      update: data,
    });
  }

  /** Finds a subscription by id. */
  async findById(
    subscriptionId: string,
    options?: RepositoryOperationOptions,
  ): Promise<Subscription | null> {
    const row = await this.context.getClient(options).subscription.findUnique({
      where: { id: subscriptionId },
    });
    return row === null ? null : prismaSubscriptionMapper.toDomain(row);
  }

  /** Finds the newest open subscription for an organization. */
  async findCurrentByOrganizationId(
    organizationId: string,
    options?: RepositoryOperationOptions,
  ): Promise<Subscription | null> {
    const row = await this.context.getClient(options).subscription.findFirst({
      where: {
        organizationId,
        status: { in: ["pending", "incomplete", "trialing", "active", "past_due", "paused"] },
      },
      orderBy: { createdAt: "desc" },
    });
    return row === null ? null : prismaSubscriptionMapper.toDomain(row);
  }

  /** Lists all subscriptions for one tenant in newest-first order. */
  async listByOrganizationId(
    organizationId: string,
    options?: RepositoryOperationOptions,
  ): Promise<readonly Subscription[]> {
    const rows = await this.context.getClient(options).subscription.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => prismaSubscriptionMapper.toDomain(row));
  }

  /** Finds a subscription by provider subscription id and optional tenant hints. */
  async findByProviderSubscriptionId(
    input: FindSubscriptionByProviderSubscriptionIdInput,
    options?: RepositoryOperationOptions,
  ): Promise<Subscription | null> {
    const row = await this.context.getClient(options).subscription.findFirst({
      where: {
        provider: input.provider,
        providerSubscriptionId: input.providerSubscriptionId,
        ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
        ...(input.providerConnectionId === undefined
          ? {}
          : { providerConnectionId: input.providerConnectionId }),
      },
    });
    return row === null ? null : prismaSubscriptionMapper.toDomain(row);
  }
}
