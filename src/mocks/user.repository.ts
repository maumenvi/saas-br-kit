import type { User, UserRepositoryPort } from "../core/index.ts";

export class UserRepositoryMock implements UserRepositoryPort {
  readonly users: User[] = []

  save(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }
}
