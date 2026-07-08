export type TransactionScope = Readonly<{
  id: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type TransactionManagerPort = Readonly<{
  runInTransaction<T>(operation: (transaction: TransactionScope) => Promise<T>): Promise<T>;
}>;
