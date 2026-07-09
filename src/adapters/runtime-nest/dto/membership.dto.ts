import { ApiProperty } from "@nestjs/swagger";

export class InviteOrganizationActorBodyDto {
  @ApiProperty({ description: "Actor que receberá acesso.", example: "user_2" })
  userId!: string;

  @ApiProperty({
    description: "Role de funcionário configurada na organization.",
    example: "GERENTE",
  })
  role!: string;
}

export class CreateInvitedOrganizationActorBodyDto {
  @ApiProperty({ description: "Email usado como identidade de login.", example: "ana@example.com" })
  email!: string;

  @ApiProperty({
    description: "Senha inicial do actor, com no mínimo oito caracteres.",
    example: "senha-segura",
    minLength: 8,
    writeOnly: true,
  })
  password!: string;

  @ApiProperty({ description: "Role configurada na organization.", example: "GERENTE" })
  role!: string;

  @ApiProperty({ description: "Nome exibido no sistema.", example: "Ana Silva", required: false })
  displayName?: string;
}

export class ChangeOrganizationActorRoleBodyDto {
  @ApiProperty({ description: "Nova role configurada na organization.", example: "ADM" })
  role!: string;
}
