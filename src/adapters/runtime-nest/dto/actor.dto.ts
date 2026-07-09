import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateActorBodyDto {
  @ApiProperty({ description: "Email usado como identidade de login.", example: "ana@example.com" })
  email!: string;

  @ApiProperty({
    description: "Senha do actor, com no mínimo oito caracteres.",
    example: "senha-segura",
    minLength: 8,
    writeOnly: true,
  })
  password!: string;

  @ApiPropertyOptional({ description: "Nome exibido no sistema.", example: "Ana Silva" })
  displayName?: string;
}

export class CreateAccountBodyDto {
  @ApiProperty({ description: "Email usado como identidade de login.", example: "ana@example.com" })
  email!: string;

  @ApiProperty({
    description: "Senha da conta, com no mínimo oito caracteres.",
    example: "senha-segura",
    minLength: 8,
    writeOnly: true,
  })
  password!: string;

  @ApiPropertyOptional({ description: "Nome exibido para o actor.", example: "Ana Silva" })
  displayName?: string;

  @ApiProperty({ description: "Nome público da organization inicial.", example: "Minha empresa" })
  organizationName!: string;

  @ApiPropertyOptional({
    description: "Subdomínio da organization inicial.",
    example: "minha-empresa",
  })
  organizationSubdomain?: string;

  @ApiPropertyOptional({
    description: "URL canônica da organization inicial.",
    example: "https://minha-empresa.example.com",
  })
  organizationUrl?: string;

  @ApiPropertyOptional({ example: "browser_1" })
  deviceId?: string;
}

export class RefreshActorTokenBodyDto {
  @ApiProperty({ description: "Refresh token opaco emitido no login.", writeOnly: true })
  refreshToken!: string;

  @ApiPropertyOptional({ example: "browser_1" })
  deviceId?: string;
}

export class UpdateActorBodyDto {
  @ApiPropertyOptional({ nullable: true, example: "Ana Silva" })
  displayName?: string | null;

  @ApiPropertyOptional({ enum: ["active", "disabled"] })
  status?: "active" | "disabled";
}

export class LoginActorBodyDto {
  @ApiProperty({ example: "ana@example.com" })
  email!: string;

  @ApiProperty({ example: "senha-segura", writeOnly: true })
  password!: string;

  @ApiPropertyOptional({ example: "browser_1" })
  deviceId?: string;

  @ApiPropertyOptional({
    description:
      "URL do tenant. Quando informada, o login retorna apenas organizations acessíveis nessa URL.",
    nullable: true,
    example: "https://clinica-centro.example.com",
  })
  organizationUrl?: string | null;
}

export class ChangeActorPasswordBodyDto {
  @ApiProperty({
    description: "Senha atual para confirmar a troca.",
    example: "senha-segura",
    minLength: 8,
    writeOnly: true,
  })
  currentPassword!: string;

  @ApiProperty({
    description: "Nova senha com no mínimo oito caracteres.",
    example: "senha-mais-segura",
    minLength: 8,
    writeOnly: true,
  })
  newPassword!: string;
}

export class ForgotPasswordBodyDto {
  @ApiProperty({ example: "ana@example.com" })
  email!: string;

  @ApiPropertyOptional({
    description: "Base URL usada para montar o link de reset enviado por email.",
    example: "https://app.example.com/reset-password",
  })
  resetUrlBase?: string;
}

export class ResetPasswordBodyDto {
  @ApiProperty({
    description: "Token de recuperação recebido por email.",
    example: "eyJhbGciOi...",
    writeOnly: true,
  })
  token!: string;

  @ApiProperty({
    description: "Nova senha com no mínimo oito caracteres.",
    example: "senha-mais-segura",
    minLength: 8,
    writeOnly: true,
  })
  newPassword!: string;
}
