import type { Result } from "../../errors/result.ts";
import { freezeSafeMetadata, type SafeMetadata } from "../metadata/index.ts";
import {
  ensureAllowedString,
  normalizeEmail,
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import { CUSTOMER_STATUSES } from "./status.ts";
import type { CreateCustomerEntityInput, CustomerProps } from "./types.ts";

/** Organization-scoped customer optionally linked to subscriptions. */
export class Customer {
  public readonly id: string;
  public readonly organizationId: string;
  public readonly name: string;
  public readonly status: (typeof CUSTOMER_STATUSES)[number];
  public readonly createdAt: string;
  public readonly updatedAt: string;
  public readonly email?: string;
  public readonly document?: string;
  public readonly metadata?: SafeMetadata;

  private constructor(props: CustomerProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.name = props.name;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    if (props.email !== undefined) this.email = props.email;
    if (props.document !== undefined) this.document = props.document;
    if (props.metadata !== undefined) this.metadata = props.metadata;
    Object.freeze(this);
  }

  static create(input: CreateCustomerEntityInput): Result<Customer> {
    const id = normalizeRequiredText("customer.id", input.id, { maxLength: 120 });
    if (!id.ok) return id;
    const organizationId = normalizeRequiredText("customer.organizationId", input.organizationId, {
      maxLength: 120,
    });
    if (!organizationId.ok) return organizationId;
    const name = normalizeRequiredText("customer.name", input.name, {
      minLength: 2,
      maxLength: 160,
    });
    if (!name.ok) return name;
    const email =
      input.email === undefined
        ? ({ ok: true, data: undefined } as const)
        : normalizeEmail("customer.email", input.email);
    if (!email.ok) return email;
    const document = normalizeOptionalText("customer.document", input.document, {
      maxLength: 30,
    });
    if (!document.ok) return document;
    const status = ensureAllowedString(
      "customer.status",
      input.status ?? "active",
      CUSTOMER_STATUSES,
    );
    if (!status.ok) return status;
    const createdAt = normalizeTimestamp("customer.createdAt", input.createdAt);
    if (!createdAt.ok) return createdAt;
    const updatedAt = normalizeTimestamp("customer.updatedAt", input.updatedAt ?? createdAt.data);
    if (!updatedAt.ok) return updatedAt;
    const metadata = freezeSafeMetadata(input.metadata);
    return {
      ok: true,
      data: new Customer({
        id: id.data,
        organizationId: organizationId.data,
        name: name.data,
        status: status.data,
        createdAt: createdAt.data,
        updatedAt: updatedAt.data,
        ...(email.data === undefined ? {} : { email: email.data }),
        ...(document.data === undefined ? {} : { document: document.data }),
        ...(metadata === undefined ? {} : { metadata }),
      }),
    };
  }
}
