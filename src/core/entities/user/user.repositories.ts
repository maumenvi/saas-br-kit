import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { User } from "./user.ts";

export interface UserRepositoryPort<Status, Extra = unknown> extends RepositoryPort<User<Status>> {
  save(user: User<Status, Extra>): Promise<void>;
  update(user: User<Status, Extra>): Promise<void>;
  changeStatus(user: User<Status, Extra>): Promise<void>;
  findById(id: string): Promise<User<Status, Extra> | null>;
  findByEmail(email: string): Promise<User<Status, Extra> | null>;
  findByTelephone(telephone: string): Promise<User<Status, Extra> | null>;
  findByName(name: string): Promise<User<Status, Extra>[]>;
}
