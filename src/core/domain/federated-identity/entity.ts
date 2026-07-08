import { fail, type Result } from "../../errors/result.ts";
import {
  domainErrorFactory,
  normalizeEmail,
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeTimestamp,
} from "../validation/index.ts";
import type { CreateFederatedIdentityInput, FederatedIdentityProps } from "./types.ts";

/** Links one local user to a stable subject issued by an external identity provider. */
export class FederatedIdentity {
  /** Local identity record identifier. */
  public readonly id: string;

  /** Local user controlled by the Core. */
  public readonly userId: string;

  /** Runtime provider alias used by API routes and configuration. */
  public readonly providerId: string;

  /** Exact HTTPS issuer that authenticated the subject. */
  public readonly issuer: string;

  /** Stable provider subject; email is never used as its replacement. */
  public readonly subject: string;

  /** Last verified email supplied when the identity was linked. */
  public readonly email?: string;

  /** Creation timestamp. */
  public readonly createdAt: string;

  /** Last update timestamp. */
  public readonly updatedAt: string;

  private constructor(props: FederatedIdentityProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.providerId = props.providerId;
    this.issuer = props.issuer;
    this.subject = props.subject;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    if (props.email !== undefined) {
      this.email = props.email;
    }
    Object.freeze(this);
  }

  /** Creates a federated identity after validating its stable provider coordinates. */
  static create(input: CreateFederatedIdentityInput): Result<FederatedIdentity> {
    const id = normalizeRequiredText("federatedIdentity.id", input.id, { maxLength: 120 });
    if (!id.ok) return id;
    const userId = normalizeRequiredText("federatedIdentity.userId", input.userId, {
      maxLength: 120,
    });
    if (!userId.ok) return userId;
    const providerId = normalizeRequiredText("federatedIdentity.providerId", input.providerId, {
      maxLength: 80,
    });
    if (!providerId.ok) return providerId;
    const issuer = normalizeRequiredText("federatedIdentity.issuer", input.issuer, {
      maxLength: 500,
    });
    if (!issuer.ok) return issuer;
    if (!FederatedIdentity.isValidIssuer(issuer.data)) {
      return fail(
        domainErrorFactory.validation(
          "federatedIdentity.issuer.invalid",
          "federatedIdentity.issuer must be an HTTPS issuer URL without query or fragment.",
        ),
      );
    }
    const subject = normalizeRequiredText("federatedIdentity.subject", input.subject, {
      maxLength: 255,
    });
    if (!subject.ok) return subject;
    const email =
      input.email === undefined
        ? normalizeOptionalText("federatedIdentity.email", undefined, { maxLength: 254 })
        : normalizeEmail("federatedIdentity.email", input.email);
    if (!email.ok) return email;
    const createdAt = normalizeTimestamp("federatedIdentity.createdAt", input.createdAt);
    if (!createdAt.ok) return createdAt;
    const updatedAt = normalizeTimestamp(
      "federatedIdentity.updatedAt",
      input.updatedAt ?? createdAt.data,
    );
    if (!updatedAt.ok) return updatedAt;

    return {
      ok: true,
      data: new FederatedIdentity({
        id: id.data,
        userId: userId.data,
        providerId: providerId.data,
        issuer: issuer.data,
        subject: subject.data,
        createdAt: createdAt.data,
        updatedAt: updatedAt.data,
        ...(email.data === undefined ? {} : { email: email.data }),
      }),
    };
  }

  private static isValidIssuer(value: string): boolean {
    try {
      const issuer = new URL(value);
      return issuer.protocol === "https:" && issuer.search.length === 0 && issuer.hash.length === 0;
    } catch {
      return false;
    }
  }
}
