import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { safeMetadataApiProperty } from "./metadata.dto.ts";
import { OrganizationRoleConfigDto } from "./organization.dto.ts";

export class ActorResponseDto {
  @ApiProperty({ description: "Identificador UUIDv7 do actor." })
  id!: string;
  @ApiProperty({ description: "Email normalizado usado no login." })
  email!: string;
  @ApiPropertyOptional({ description: "Nome exibido." })
  displayName?: string;
  @ApiProperty({ enum: ["active", "disabled"] })
  status!: string;
  @ApiProperty({ format: "date-time" })
  createdAt!: string;
  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class OrganizationResponseDto {
  @ApiProperty({ description: "Identificador UUIDv7 da organization." })
  id!: string;
  @ApiProperty({ description: "Actor proprietário." })
  ownerUserId!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty({ enum: ["active", "disabled"] })
  status!: string;
  @ApiPropertyOptional()
  subdomain?: string;
  @ApiPropertyOptional({ format: "uri" })
  url?: string;
  @ApiProperty({ type: OrganizationRoleConfigDto })
  roleConfig!: OrganizationRoleConfigDto;
  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: object;
  @ApiProperty({ format: "date-time" })
  createdAt!: string;
  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class CustomerResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  organizationId!: string;
  @ApiProperty()
  name!: string;
  @ApiPropertyOptional()
  email?: string;
  @ApiPropertyOptional()
  document?: string;
  @ApiProperty({ enum: ["active", "disabled"] })
  status!: string;
  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: object;
  @ApiProperty({ format: "date-time" })
  createdAt!: string;
  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class PlanPriceResponseDto {
  @ApiProperty({ description: "Preço recorrente em centavos." })
  amountCents!: number;
  @ApiProperty({ enum: ["BRL"] })
  currency!: string;
  @ApiProperty({ enum: ["monthly", "yearly"] })
  interval!: string;
}

export class PlanResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty({ description: "Organization proprietária do plano." })
  organizationId!: string;
  @ApiProperty()
  code!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty({ type: PlanPriceResponseDto })
  price!: PlanPriceResponseDto;
  @ApiProperty({ type: [String], description: "Benefícios exibidos no plano." })
  features!: string[];
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: string;
  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: object;
  @ApiProperty({ format: "date-time" })
  createdAt!: string;
  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class SubscriptionResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  organizationId!: string;
  @ApiProperty({ description: "Actor associado à assinatura." })
  userId!: string;
  @ApiProperty({ description: "Customer da organization." })
  customerId!: string;
  @ApiProperty()
  planId!: string;
  @ApiProperty()
  status!: string;
  @ApiProperty()
  provider!: string;
  @ApiPropertyOptional()
  providerCustomerId?: string;
  @ApiPropertyOptional()
  providerSubscriptionId?: string;
  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: object;
  @ApiProperty({ format: "date-time" })
  createdAt!: string;
  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class CreatePlanResponseDto {
  @ApiProperty({ type: PlanResponseDto })
  plan!: PlanResponseDto;
  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description: "Evento de billing plan_created.",
  })
  billingEvent!: object;
  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description: "Registro de auditoria da criação.",
  })
  auditEvent!: object;
}

export class CreateSubscriptionResponseDto {
  @ApiProperty({ type: SubscriptionResponseDto })
  subscription!: SubscriptionResponseDto;
  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description: "Evento de billing da assinatura.",
  })
  billingEvent!: object;
  @ApiProperty({
    type: "object",
    additionalProperties: true,
    description: "Registro de auditoria da criação.",
  })
  auditEvent!: object;
}

export class AuthOrganizationResponseDto {
  @ApiProperty()
  organizationId!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  role!: string;
  @ApiProperty({ type: [String] })
  permissions!: string[];
  @ApiPropertyOptional()
  subdomain?: string;
  @ApiPropertyOptional({ format: "uri" })
  url?: string;
}

export class ActorLoginResponseDto {
  @ApiProperty({ type: ActorResponseDto })
  user!: ActorResponseDto;
  @ApiProperty({ description: "Access token assinado pelo adapter configurado." })
  accessToken!: string;
  @ApiProperty({ description: "Refresh token opaco. Nunca é persistido em texto puro." })
  refreshToken!: string;
  @ApiProperty({ type: [AuthOrganizationResponseDto] })
  organizations!: AuthOrganizationResponseDto[];
}

export class RefreshActorTokenResponseDto {
  @ApiProperty({ type: ActorResponseDto })
  user!: ActorResponseDto;

  @ApiProperty({ description: "Novo access token assinado." })
  accessToken!: string;

  @ApiPropertyOptional({ format: "date-time" })
  accessTokenExpiresAt?: string;

  @ApiProperty({ description: "Novo refresh token opaco.", writeOnly: true })
  refreshToken!: string;

  @ApiProperty({ format: "date-time" })
  refreshTokenExpiresAt!: string;
}

export class InvitationDeliveryResponseDto {
  @ApiProperty({ format: "date-time" })
  expiresAt!: string;
}

export class CreateInvitedActorResponseDto {
  @ApiProperty({ type: ActorResponseDto })
  actor!: ActorResponseDto;

  @ApiProperty({ type: "object", additionalProperties: true })
  membership!: object;

  @ApiProperty({ type: InvitationDeliveryResponseDto })
  invitation!: InvitationDeliveryResponseDto;
}

export class FederatedIdentityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  providerId!: string;

  @ApiProperty({ format: "uri" })
  issuer!: string;

  @ApiProperty()
  subject!: string;

  @ApiPropertyOptional()
  email?: string;
}

export class OidcCallbackResponseDto {
  @ApiProperty({ enum: ["login", "link"] })
  flow!: "login" | "link";

  @ApiPropertyOptional({ type: FederatedIdentityResponseDto })
  identity?: FederatedIdentityResponseDto;

  @ApiPropertyOptional({ type: ActorResponseDto })
  user?: ActorResponseDto;

  @ApiPropertyOptional()
  accessToken?: string;

  @ApiPropertyOptional()
  refreshToken?: string;
}

export class CreateAccountResponseDto {
  @ApiProperty({ type: ActorResponseDto })
  user!: ActorResponseDto;

  @ApiProperty({ type: OrganizationResponseDto })
  organization!: OrganizationResponseDto;

  @ApiProperty({ description: "Access token assinado pelo adapter configurado." })
  accessToken!: string;

  @ApiProperty({ description: "Refresh token opaco. Nunca é persistido em texto puro." })
  refreshToken!: string;

  @ApiProperty({ type: [AuthOrganizationResponseDto] })
  organizations!: AuthOrganizationResponseDto[];
}

export class ChangePasswordResponseDto {
  @ApiProperty({
    description: "Indica se a senha foi alterada com sucesso.",
    example: true,
  })
  changed!: boolean;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: "Indica se a solicitação de recuperação foi aceita.",
    example: true,
  })
  requested!: boolean;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: "Indica se a senha foi redefinida com sucesso.",
    example: true,
  })
  changed!: boolean;
}
