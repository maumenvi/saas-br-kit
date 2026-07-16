export interface UserValidationQueryPort {
  findById(id: string): Promise<{
    id: string;
    enabled: boolean;
    emailVerified: boolean;
  } | null>;
}