export interface AuthPort<Input> {
  authenticate(auth: Input): Promise<boolean>;
}
