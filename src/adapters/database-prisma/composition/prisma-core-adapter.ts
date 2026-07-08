import {
  auditEventRepositoryCorePort,
  billingEventRepositoryCorePort,
  CoreRegistration,
  customerRepositoryCorePort,
  databaseAdapterCorePort,
  federatedIdentityRepositoryCorePort,
  membershipRepositoryCorePort,
  organizationRepositoryCorePort,
  passwordResetTokenRepositoryCorePort,
  planRepositoryCorePort,
  subscriptionRepositoryCorePort,
  transactionManagerCorePort,
  userCredentialsRepositoryCorePort,
  userRepositoryCorePort,
  webhookEventRepositoryCorePort,
} from "#core";
import { type PrismaDatabaseAdapter, prismaDatabaseAdapter } from "../prisma-database-adapter.ts";
import type { PrismaDatabaseClient } from "../prisma-types.ts";
import {
  createPrismaBillingRepositories,
  type PrismaBillingRepositories,
} from "../repositories/index.ts";

export type PrismaCoreAdapterInput = Readonly<{
  client: PrismaDatabaseClient;
}>;

export type PrismaCoreAdapterContext = Readonly<{
  adapters: Readonly<{ database: PrismaDatabaseAdapter }>;
  repositories: PrismaBillingRepositories;
  tenantAccess: Readonly<{
    memberships: PrismaBillingRepositories["memberships"];
    organizations: PrismaBillingRepositories["organizations"];
  }>;
}>;

export type PrismaCoreAdapterOutput = Readonly<{
  database: PrismaDatabaseAdapter;
  repositories: PrismaBillingRepositories;
}>;

/** Creates a Core registration that provides Prisma persistence and repositories. */
export function prismaCoreAdapter(
  input: PrismaCoreAdapterInput,
): CoreRegistration<"prisma", PrismaCoreAdapterContext, PrismaCoreAdapterOutput> {
  const client = input.client;
  return new CoreRegistration({
    name: "prisma",
    provides: [
      databaseAdapterCorePort,
      transactionManagerCorePort,
      organizationRepositoryCorePort,
      planRepositoryCorePort,
      subscriptionRepositoryCorePort,
      billingEventRepositoryCorePort,
      auditEventRepositoryCorePort,
      webhookEventRepositoryCorePort,
      userRepositoryCorePort,
      userCredentialsRepositoryCorePort,
      passwordResetTokenRepositoryCorePort,
      customerRepositoryCorePort,
      membershipRepositoryCorePort,
      federatedIdentityRepositoryCorePort,
    ],
    install: (registry) => {
      const database = prismaDatabaseAdapter(client);
      const repositories = createPrismaBillingRepositories(database);
      registry.provide(databaseAdapterCorePort, database);
      registry.provide(transactionManagerCorePort, database.transactionManager);
      registry.provide(organizationRepositoryCorePort, repositories.organizations);
      registry.provide(planRepositoryCorePort, repositories.plans);
      registry.provide(subscriptionRepositoryCorePort, repositories.subscriptions);
      registry.provide(billingEventRepositoryCorePort, repositories.billingEvents);
      registry.provide(auditEventRepositoryCorePort, repositories.auditEvents);
      registry.provide(webhookEventRepositoryCorePort, repositories.webhookEvents);
      registry.provide(userRepositoryCorePort, repositories.users);
      registry.provide(userCredentialsRepositoryCorePort, repositories.userCredentials);
      registry.provide(passwordResetTokenRepositoryCorePort, repositories.passwordResetTokens);
      registry.provide(customerRepositoryCorePort, repositories.customers);
      registry.provide(membershipRepositoryCorePort, repositories.memberships);
      registry.provide(federatedIdentityRepositoryCorePort, repositories.federatedIdentities);
      return {
        context: Object.freeze({
          adapters: Object.freeze({ database }),
          repositories,
          tenantAccess: Object.freeze({
            memberships: repositories.memberships,
            organizations: repositories.organizations,
          }),
        }),
        output: Object.freeze({ database, repositories }),
        ...(database.dispose === undefined ? {} : { dispose: database.dispose }),
      };
    },
  });
}
