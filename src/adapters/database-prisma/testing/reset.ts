import type { PrismaDatabaseClient } from "../prisma-types.ts";

/** Deletes adapter-owned tables in dependency order for tests. */
export async function resetPrismaAdapterData(client: PrismaDatabaseClient): Promise<void> {
  await client.webhookEvent.deleteMany?.();
  await client.billingEvent.deleteMany?.();
  await client.auditEvent.deleteMany?.();
  await client.subscription.deleteMany?.();
  await client.customer.deleteMany?.();
  await client.membership.deleteMany?.();
  await client.federatedIdentity.deleteMany?.();
  await client.plan.deleteMany?.();
  await client.organization.deleteMany?.();
  await client.passwordResetToken?.deleteMany?.();
  await client.userCredentials.deleteMany?.();
  await client.user.deleteMany?.();
}
