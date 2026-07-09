import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Subscription } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { auditEventFactory, billingEventFactory } from "../../events/index.ts";
import { applicationFailureFactory, executionPolicy, useCaseRunner } from "../../shared/index.ts";
import type { SubscriptionAppContext } from "../context/subscription-app-context.ts";
import type { CreateSubscriptionInput } from "../input/create-subscription-input.ts";
import type { CreateSubscriptionOutput } from "../output/create-subscription-output.ts";
import { subscriptionCustomerSnapshot } from "../snapshot/subscription-customer-snapshot.ts";

/** Creates provider-backed subscriptions and records billing/audit events. */
export class CreateSubscriptionUseCase {
  private readonly appContext: SubscriptionAppContext;

  /** Stores payment selector and repositories required by the flow. */
  constructor(appContext: SubscriptionAppContext) {
    this.appContext = appContext;
  }

  /** Executes the subscription flow for a tenant-scoped operation. */
  async execute(
    executionContext: ExecutionContext,
    input: CreateSubscriptionInput,
  ): Promise<Result<CreateSubscriptionOutput, CoreError>> {
    const tenant = executionPolicy.ensureTenantScope(executionContext, input.organizationId);
    if (!tenant.ok) {
      return tenant;
    }

    return useCaseRunner.runSafely(async () => {
      const selectedProvider = await this.appContext.paymentProviderSelector.selectProvider({
        organizationId: input.organizationId,
        capability: "subscription",
        ...(input.requestedProvider === undefined
          ? {}
          : { requestedProvider: input.requestedProvider }),
      });

      if (!selectedProvider.ok) {
        return selectedProvider;
      }

      if (selectedProvider.data.connection.status !== "active") {
        return applicationFailureFactory.external(
          "payment_provider.connection_inactive",
          "Selected payment provider connection is inactive.",
          {
            provider: selectedProvider.data.connection.provider,
            connectionId: selectedProvider.data.connection.id,
          },
        );
      }

      if (!selectedProvider.data.provider.capabilities.includes("subscription")) {
        return applicationFailureFactory.external(
          "payment_provider.subscription_unsupported",
          "Selected payment provider does not support subscriptions.",
          { provider: selectedProvider.data.provider.provider },
        );
      }

      return this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const organization = await this.appContext.repositories.organizations.findById(
          input.organizationId,
          { transaction },
        );
        if (organization === null || organization.status !== "active") {
          return applicationFailureFactory.notFound(
            "organization.not_found",
            "Active organization was not found for subscription creation.",
            { organizationId: input.organizationId },
          );
        }

        const plan = await this.appContext.repositories.plans.findById(
          input.organizationId,
          input.planId,
          { transaction },
        );
        if (plan === null || plan.status !== "active") {
          return applicationFailureFactory.notFound(
            "plan.not_found",
            "Active plan was not found for subscription creation.",
            { planId: input.planId },
          );
        }

        const now = this.appContext.clock.now().toISOString();
        const customer = await this.appContext.repositories.customers.findById(input.customerId, {
          transaction,
        });
        if (customer === null) {
          return applicationFailureFactory.notFound(
            "customer.not_found",
            "An active organization customer is required for subscription creation.",
          );
        }
        const resolvedCustomer = customer;
        if (
          resolvedCustomer.organizationId !== organization.id ||
          resolvedCustomer.status !== "active"
        ) {
          return applicationFailureFactory.notFound(
            "customer.not_found",
            "An active organization customer is required for subscription creation.",
          );
        }

        const organizationSubscriptions =
          await this.appContext.repositories.subscriptions.listByOrganizationId(organization.id, {
            transaction,
          });
        const currentCustomerSubscription = organizationSubscriptions.find(
          (subscription) =>
            subscription.customerId === resolvedCustomer.id && subscription.isOpen(),
        );
        if (currentCustomerSubscription !== undefined) {
          return applicationFailureFactory.conflict(
            "subscription.customer_current_conflict",
            "Customer already has an open subscription.",
            {
              organizationId: organization.id,
              customerId: resolvedCustomer.id,
              subscriptionId: currentCustomerSubscription.id,
            },
          );
        }

        const pendingSubscription = Subscription.create({
          id: this.appContext.idGenerator.newId(),
          organizationId: organization.id,
          userId: input.userId,
          customerId: resolvedCustomer.id,
          planId: plan.id,
          provider: selectedProvider.data.provider.provider,
          providerConnectionId: selectedProvider.data.connection.id,
          status: "pending",
          createdAt: now,
          ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
        });

        if (!pendingSubscription.ok) {
          return pendingSubscription;
        }

        await this.appContext.repositories.subscriptions.save(pendingSubscription.data, {
          transaction,
        });

        const providerResult = await selectedProvider.data.provider.createCustomerAndSubscription({
          executionContext,
          connection: selectedProvider.data.connection,
          organization,
          plan,
          subscription: pendingSubscription.data,
          customer: subscriptionCustomerSnapshot.freeze({
            name: resolvedCustomer.name,
            ...(resolvedCustomer.email === undefined ? {} : { email: resolvedCustomer.email }),
            ...(resolvedCustomer.document === undefined
              ? {}
              : { document: resolvedCustomer.document }),
            ...(resolvedCustomer.metadata === undefined
              ? {}
              : { metadata: resolvedCustomer.metadata }),
          }),
          requestedAt: now,
        });

        if (!providerResult.ok) {
          const failedSubscription = pendingSubscription.data.markProviderFailure({
            updatedAt: this.appContext.clock.now().toISOString(),
          });
          if (!failedSubscription.ok) {
            return failedSubscription;
          }

          const failedEvent = billingEventFactory.subscriptionProviderFailed({
            id: this.appContext.idGenerator.newId(),
            occurredAt: failedSubscription.data.updatedAt,
            subscription: failedSubscription.data,
            provider: selectedProvider.data.provider.provider,
            providerErrorCode: providerResult.error.code,
            providerErrorKind: providerResult.error.kind,
          });
          if (!failedEvent.ok) {
            return failedEvent;
          }

          const failedAuditEvent = auditEventFactory.subscriptionProviderFailed({
            id: this.appContext.idGenerator.newId(),
            occurredAt: failedSubscription.data.updatedAt,
            executionContext,
            subscription: failedSubscription.data,
            provider: selectedProvider.data.provider.provider,
            providerErrorCode: providerResult.error.code,
            providerErrorKind: providerResult.error.kind,
          });
          if (!failedAuditEvent.ok) {
            return failedAuditEvent;
          }

          await this.appContext.repositories.subscriptions.save(failedSubscription.data, {
            transaction,
          });
          await this.appContext.repositories.billingEvents.save(failedEvent.data, { transaction });
          await this.appContext.repositories.auditEvents.save(failedAuditEvent.data, {
            transaction,
          });

          return providerResult;
        }

        const updatedSubscription = pendingSubscription.data.applyProvider({
          providerCustomerId: providerResult.data.providerCustomerId,
          providerSubscriptionId: providerResult.data.providerSubscriptionId,
          status: providerResult.data.status,
          ...(providerResult.data.currentPeriodStart === undefined
            ? {}
            : { currentPeriodStart: providerResult.data.currentPeriodStart }),
          ...(providerResult.data.currentPeriodEnd === undefined
            ? {}
            : { currentPeriodEnd: providerResult.data.currentPeriodEnd }),
          updatedAt: this.appContext.clock.now().toISOString(),
        });

        if (!updatedSubscription.ok) {
          return updatedSubscription;
        }

        const billingEvent = billingEventFactory.subscriptionCreated({
          id: this.appContext.idGenerator.newId(),
          occurredAt: updatedSubscription.data.updatedAt,
          subscription: updatedSubscription.data,
          provider: selectedProvider.data.provider.provider,
        });

        if (!billingEvent.ok) {
          return billingEvent;
        }

        const auditEvent = auditEventFactory.subscriptionCreated({
          id: this.appContext.idGenerator.newId(),
          occurredAt: updatedSubscription.data.updatedAt,
          executionContext,
          subscription: updatedSubscription.data,
          provider: selectedProvider.data.provider.provider,
        });

        if (!auditEvent.ok) {
          return auditEvent;
        }

        await this.appContext.repositories.subscriptions.save(updatedSubscription.data, {
          transaction,
        });
        await this.appContext.repositories.billingEvents.save(billingEvent.data, { transaction });
        await this.appContext.repositories.auditEvents.save(auditEvent.data, { transaction });

        return ok(
          Object.freeze({
            subscription: updatedSubscription.data,
            billingEvent: billingEvent.data,
            auditEvent: auditEvent.data,
          }),
        );
      });
    });
  }
}
