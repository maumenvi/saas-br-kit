import type { User } from "../../user/application/input/user.input.ts";

export interface UserRepositoryPort {
  save(user: User): Promise<void>;
}
