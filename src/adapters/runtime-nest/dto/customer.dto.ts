import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { type NestSafeMetadataDto, safeMetadataApiProperty } from "./metadata.dto.ts";

export class CreateCustomerBodyDto {
  @ApiProperty({ description: "Nome do cliente.", example: "Maria Souza" })
  name!: string;

  @ApiPropertyOptional({ example: "maria@example.com" })
  email?: string;

  @ApiPropertyOptional({ description: "CPF, CNPJ ou documento externo.", example: "12345678901" })
  document?: string;

  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: NestSafeMetadataDto;
}

export class UpdateCustomerBodyDto {
  @ApiPropertyOptional({ example: "Maria Souza" })
  name?: string;

  @ApiPropertyOptional({ nullable: true, example: "maria@example.com" })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "12345678901" })
  document?: string | null;

  @ApiPropertyOptional({ ...safeMetadataApiProperty, nullable: true })
  metadata?: NestSafeMetadataDto | null;
}
