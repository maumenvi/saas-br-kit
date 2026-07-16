import { UserErrors } from "./user.errors.ts";

export class Email {
  public readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  validate(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) throw UserErrors.invalidEmail(this.value);
  }
}
