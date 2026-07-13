import type { User, UserRepositoryPort } from "../core/index.ts";
import { type Status } from "./status.ts";

export class UserRepositoryMock implements UserRepositoryPort<Status> {
  readonly users: User<Status>[] = []

  save(user: User<Status>): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }

  update(user: User<Status>): Promise<void> {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
    }
    return Promise.resolve();
  }
  changeStatus(user: User<Status>): Promise<void> {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index].status = "inactive" as Status;
    }
    return Promise.resolve();
  }

  findById(id: string): Promise<User<Status> | null> {
    const user = this.users.find(u => u.id === id) || null;
    return Promise.resolve(user);
  }
  findByEmail(email: string): Promise<User<Status> | null> {
    const user = this.users.find(u => u.email.value === email) || null;
    return Promise.resolve(user);
  }
  findByTelephone(telephone: string): Promise<User<Status> | null> {
    const user = this.users.find(u => u.telephone.value === telephone) || null;
    return Promise.resolve(user);
  }
  findByName(name: string): Promise<User<Status>[]> {
    const users = this.users.filter(u => u.name === name);
    return Promise.resolve(users);
  }
}
