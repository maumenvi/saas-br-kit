import type { RepositoryPort } from "../ports/repositories.port.ts";
import type { User } from "./application/user.input.ts";

export interface UserRepositoryPort<Status> extends RepositoryPort<User<Status>> {
  save(user: User<Status>): Promise<void>;
  update(user: User<Status>): Promise<void>;
  changeStatus(user: User<Status>): Promise<void>;
  findById(id: string): Promise<User<Status> | null>;
  findByEmail(email: string): Promise<User<Status> | null>;
  findByTelephone(telephone: string): Promise<User<Status> | null>;
  findByName(name: string): Promise<User<Status>[]>;
}
