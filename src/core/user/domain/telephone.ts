import { UserErrors } from "./user.errors.ts";

export class Telephone {
  public readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  validate(): void {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(this.value)) throw UserErrors.invalidPhone(this.value);
  }
}
