import type { DatabasePort } from "../core/ports/database.port.ts";

type transactionMock = Readonly<{
  type: 'mock-transaction';
}>

export class DatabaseMock implements DatabasePort {
  readonly transaction: transactionMock = {
    type: 'mock-transaction',
  }
  started = 0
  commited = 0
  rolledback = 0

  async run<Result>(
    callback: (transaction: unknown) => Promise<Result>
  ): Promise<Result> {
    this.started += 1
    try {
      const result = await callback(this.transaction)
      this.commited += 1
      return result
    } catch (error: unknown) {
      this.rolledback += 1
      throw error
    }
  }
}
