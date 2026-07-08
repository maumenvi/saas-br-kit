export type VerifyPasswordInput = Readonly<{
  password: string;
  passwordHash: string;
}>;

export type PasswordHasherPort = Readonly<{
  hashPassword(password: string): Promise<string>;
  verifyPassword(input: VerifyPasswordInput): Promise<boolean>;
}>;
