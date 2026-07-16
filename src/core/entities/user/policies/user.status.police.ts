export interface UserStatusPolicyPort<Status> {
  isEnabled(status: Status): boolean;
}