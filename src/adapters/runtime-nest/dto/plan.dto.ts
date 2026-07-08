import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { type NestSafeMetadataDto, safeMetadataApiProperty } from "./metadata.dto.ts";

/** Request body for billing plan creation. */
export class CreatePlanBodyDto {
  @ApiProperty({ example: "starter" })
  code!: string;

  @ApiProperty({ example: "Starter" })
  name!: string;

  @ApiProperty({ example: 9900 })
  amountCents!: number;

  @ApiProperty({ enum: ["monthly", "yearly"], example: "monthly" })
  interval!: "monthly" | "yearly";

  @ApiPropertyOptional({ type: [String], example: ["3 consultas por mês", "2 exames por mês"] })
  features?: string[];

  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: NestSafeMetadataDto;
}

export class UpdatePlanBodyDto {
  @ApiPropertyOptional({ example: "Starter atualizado" })
  name?: string;

  @ApiPropertyOptional({ example: 12900 })
  amountCents?: number;

  @ApiPropertyOptional({ enum: ["monthly", "yearly"] })
  interval?: "monthly" | "yearly";

  @ApiPropertyOptional({ type: [String], example: ["3 consultas por mês"] })
  features?: string[];

  @ApiPropertyOptional({ ...safeMetadataApiProperty, nullable: true })
  metadata?: NestSafeMetadataDto | null;
}
