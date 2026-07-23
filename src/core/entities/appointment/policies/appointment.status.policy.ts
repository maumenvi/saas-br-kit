export interface AppointmentStatusPolicy<Status> {
  isCancelled(status: Status): boolean;
  cancelledByCustomerStatus: Status;
  cancelledByActorStatus: Status;
}
