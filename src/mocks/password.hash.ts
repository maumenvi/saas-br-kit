import type { PasswordHashPort } from '../core/ports/password.hash.port.ts';

export class PasswordHashMock implements PasswordHashPort {
  hash(password: string): Promise<string> {
    return Promise.resolve(`hashed-${password}`);
  }
  verify(password: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed-${password}`);
  }

}
