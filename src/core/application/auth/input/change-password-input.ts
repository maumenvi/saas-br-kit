export type ChangePasswordInput = Readonly<{
  actorId: string;
  currentPassword: string;
  newPassword: string;
}>;
