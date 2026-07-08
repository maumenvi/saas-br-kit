import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { type NestSafeMetadataDto, safeMetadataApiProperty } from "./metadata.dto.ts";

/** Request body for receiving provider payment webhooks. */
export class ReceivePaymentWebhookBodyDto {
  @ApiProperty({ example: "evt_1" })
  providerEventId!: string;

  @ApiProperty({ example: "PAYMENT_RECEIVED" })
  eventName!: string;

  @ApiProperty({ example: { event: "PAYMENT_RECEIVED" } })
  rawPayload!: unknown;

  @ApiPropertyOptional({ example: "org_1" })
  organizationId?: string;

  @ApiPropertyOptional({ example: "conn_1" })
  providerConnectionId?: string;

  @ApiPropertyOptional({ example: "account_1" })
  providerAccountId?: string;

  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: NestSafeMetadataDto;
}
