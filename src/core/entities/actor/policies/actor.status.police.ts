export interface ActorStatusPolicyPort<Status> {
  isEnabled(status: Status): boolean;
}
