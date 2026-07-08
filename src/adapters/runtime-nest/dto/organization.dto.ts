import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { type NestSafeMetadataDto, safeMetadataApiProperty } from "./metadata.dto.ts";

export class OrganizationEmployeeRoleDto {
  @ApiProperty({ description: "Nome configurável do tipo de funcionário.", example: "GERENTE" })
  name!: string;

  @ApiProperty({
    description: "Permissões concedidas a esse tipo de funcionário.",
    type: [String],
    example: ["customers:*", "billing:subscriptions:read"],
  })
  permissions!: string[];
}

export class OrganizationRoleConfigDto {
  @ApiPropertyOptional({
    description: "Nome da role de proprietário. O padrão é owner.",
    example: "DONO",
  })
  ownerRoleName?: string;

  @ApiPropertyOptional({
    description:
      "Tipos de funcionário. Sem configuração, existe somente employee e ele não administra actors.",
    type: [OrganizationEmployeeRoleDto],
  })
  employeeRoles?: OrganizationEmployeeRoleDto[];
}

/** Request body for organization creation. */
export class CreateOrganizationBodyDto {
  @ApiProperty({ description: "Actor proprietário inicial.", example: "user_1" })
  ownerUserId!: string;

  @ApiProperty({ description: "Nome público da organização.", example: "Minha empresa" })
  name!: string;

  @ApiPropertyOptional({ description: "Subdomínio único.", example: "clinica-centro" })
  subdomain?: string;

  @ApiPropertyOptional({
    description: "URL canônica opcional usada para restringir o login por tenant.",
    example: "https://clinica-centro.example.com",
  })
  url?: string;

  @ApiPropertyOptional({ type: OrganizationRoleConfigDto })
  roleConfig?: OrganizationRoleConfigDto;

  @ApiPropertyOptional(safeMetadataApiProperty)
  metadata?: NestSafeMetadataDto;
}

export class UpdateOrganizationBodyDto {
  @ApiPropertyOptional({ example: "Novo nome" })
  name?: string;

  @ApiPropertyOptional({ nullable: true, example: "clinica-centro" })
  subdomain?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "https://clinica-centro.example.com" })
  url?: string | null;

  @ApiPropertyOptional({ type: OrganizationRoleConfigDto })
  roleConfig?: OrganizationRoleConfigDto;

  @ApiPropertyOptional({ ...safeMetadataApiProperty, nullable: true })
  metadata?: NestSafeMetadataDto | null;
}
