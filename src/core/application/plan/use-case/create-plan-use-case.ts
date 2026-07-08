import type { ExecutionContext } from "../../../context/execution-context.ts";
import { Plan } from "../../../domain/index.ts";
import { type CoreError, ok, type Result } from "../../../errors/result.ts";
import { auditEventFactory, billingEventFactory } from "../../events/index.ts";
import { applicationFailureFactory, useCaseRunner } from "../../shared/index.ts";
import type { CreatePlanAppContext } from "../context/create-plan-app-context.ts";
import { ensurePlanAccess } from "../ensure-plan-access.ts";
import type { CreatePlanInput } from "../input/create-plan-input.ts";
import type { CreatePlanOutput } from "../output/create-plan-output.ts";

/** Creates billing plans and records billing/audit events. */
export class CreatePlanUseCase {
  private readonly appContext: CreatePlanAppContext;

  /** Stores the ports required to persist plans and events. */
  constructor(appContext: CreatePlanAppContext) {
    this.appContext = appContext;
  }

  /** Executes plan creation after checking billing plan write permission. */
  async execute(
    executionContext: ExecutionContext,
    input: CreatePlanInput,
  ): Promise<Result<CreatePlanOutput, CoreError>> {
    const access = ensurePlanAccess(executionContext, input.organizationId, "billing:plans:write");
    if (!access.ok) {
      return access;
    }

    return useCaseRunner.runSafely(async () =>
      this.appContext.transactionManager.runInTransaction(async (transaction) => {
        const now = this.appContext.clock.now().toISOString();
        const plan = Plan.create({
          id: this.appContext.idGenerator.newId(),
          organizationId: input.organizationId,
          code: input.code,
          name: input.name,
          amountCents: input.amountCents,
          interval: input.interval,
          ...(input.features === undefined ? {} : { features: input.features }),
          createdAt: now,
          ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
        });

        if (!plan.ok) {
          return plan;
        }

        const existing = await this.appContext.repositories.plans.findByCode(
          plan.data.organizationId,
          plan.data.code,
          { transaction },
        );
        if (existing !== null) {
          return applicationFailureFactory.conflict(
            "plan.code_conflict",
            "A plan with this code already exists.",
            {
              organizationId: plan.data.organizationId,
              code: plan.data.code,
            },
          );
        }

        const billingEvent = billingEventFactory.planCreated({
          id: this.appContext.idGenerator.newId(),
          occurredAt: now,
          plan: plan.data,
        });

        if (!billingEvent.ok) {
          return billingEvent;
        }

        const auditEvent = auditEventFactory.planCreated({
          id: this.appContext.idGenerator.newId(),
          occurredAt: now,
          executionContext,
          plan: plan.data,
        });

        if (!auditEvent.ok) {
          return auditEvent;
        }

        await this.appContext.repositories.plans.save(plan.data, { transaction });
        await this.appContext.repositories.billingEvents.save(billingEvent.data, { transaction });
        await this.appContext.repositories.auditEvents.save(auditEvent.data, { transaction });

        return ok(
          Object.freeze({
            plan: plan.data,
            billingEvent: billingEvent.data,
            auditEvent: auditEvent.data,
          }),
        );
      }),
    );
  }
}
