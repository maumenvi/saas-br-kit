export type EntityInput<T> = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: T;
}