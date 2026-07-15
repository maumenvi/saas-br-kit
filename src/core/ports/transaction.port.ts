export interface TransactionPort {
  run<Result>(
    operation: () => Promise<Result>
  ): Promise<Result>;
}