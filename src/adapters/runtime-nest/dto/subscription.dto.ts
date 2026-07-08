import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { type NestSafeMetadataDto, safeMetadataApiProperty } from "./metadata.dto.ts";

/** Customer snapshot used by subscription creation. */
export class SubscriptionCustomerBodyDto {
  @ApiProperty({ example: "Marco Silva" })
  name!: string;

  @ApiPropertyOptional({ example: "marco@example.com" })
  email?: string;

  @ApiPropertyOptional({ example: "12345678901" })
  document?: string;

  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: NestSafeMetadataDto;
}

/** Request body for subscription creation. */
export class CreateSubscriptionBodyDto {
  @ApiProperty({
    description: "Identificador do actor proprietário da assinatura.",
    example: "user_1",
  })
  userId!: string;

  @ApiProperty({ example: "plan_1" })
  planId!: string;

  @ApiPropertyOptional({
    description: "Customer existente da organization. Use este campo ou customer.",
    example: "customer_1",
  })
  customerId?: string;

  @ApiPropertyOptional({
    description: "Dados para criar um customer no mesmo fluxo. Use este campo ou customerId.",
    type: SubscriptionCustomerBodyDto,
  })
  customer?: SubscriptionCustomerBodyDto;

  @ApiPropertyOptional({ example: "asaas" })
  requestedProvider?: string;

  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: NestSafeMetadataDto;
}

export class UpdateSubscriptionBodyDto {
  @ApiPropertyOptional({ description: "Actor associado à assinatura.", example: "user_1" })
  userId?: string;

  @ApiPropertyOptional({ ...safeMetadataApiProperty, nullable: true })
  metadata?: NestSafeMetadataDto | null;
}
