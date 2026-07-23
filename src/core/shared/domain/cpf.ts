import { DocumentErrors } from './document.errors.ts';

export class CPF {
  readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  validate(): void {
    const digits = this.value.replace(/[.-]/g, '');
    if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) {
      throw DocumentErrors.invalidCpf(this.value);
    }

    const first = this.checkDigit(digits.slice(0, 9), 10);
    const second = this.checkDigit(`${digits.slice(0, 9)}${first}`, 11);
    if (digits.slice(9) !== `${first}${second}`) {
      throw DocumentErrors.invalidCpf(this.value);
    }
  }

  private checkDigit(digits: string, weight: number): number {
    const sum = [...digits].reduce(
      (total, digit, index) => total + Number(digit) * (weight - index),
      0,
    );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  }
}
