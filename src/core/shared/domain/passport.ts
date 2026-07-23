import { DocumentErrors } from './document.errors.ts';

export class Passport {
  readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  validate(): void {
    if (!/^[A-Z0-9]{6,20}$/i.test(this.value)) {
      throw DocumentErrors.invalidPassport(this.value);
    }
  }
}
