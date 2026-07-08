export type PrismaJson =
  | string
  | number
  | boolean
  | null
  | PrismaJson[]
  | { [key: string]: PrismaJson };

export type PrismaOperationOptions = Readonly<{
  where?: Record<string, unknown>;
  data?: Record<string, unknown>;
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
}>;

// Generated Prisma delegates use model-specific generic arguments. `any` keeps
// this structural boundary compatible while repository inputs remain typed.
// biome-ignore lint/suspicious/noExplicitAny: required for generated delegate compatibility
type PrismaDelegateOperation<TResult> = (...args: any[]) => TResult;

export type PrismaModelDelegate = Readonly<{
  upsert: PrismaDelegateOperation<Promise<unknown>>;
  create: PrismaDelegateOperation<Promise<unknown>>;
  update: PrismaDelegateOperation<Promise<unknown>>;
  findUnique: PrismaDelegateOperation<Promise<unknown | null>>;
  findFirst: PrismaDelegateOperation<Promise<unknown | null>>;
  findMany: PrismaDelegateOperation<Promise<readonly unknown[]>>;
  deleteMany?: PrismaDelegateOperation<Promise<unknown>>;
}>;

export type PrismaDatabaseClient = Readonly<{
  organization: PrismaModelDelegate;
  user: PrismaModelDelegate;
  userCredentials: PrismaModelDelegate;
  federatedIdentity: PrismaModelDelegate;
  passwordResetToken: PrismaModelDelegate;
  customer: PrismaModelDelegate;
  membership: PrismaModelDelegate;
  plan: PrismaModelDelegate;
  subscription: PrismaModelDelegate;
  billingEvent: PrismaModelDelegate;
  auditEvent: PrismaModelDelegate;
  webhookEvent: PrismaModelDelegate;
  $transaction<TValue>(
    operation: (client: PrismaTransactionClient) => Promise<TValue>,
  ): Promise<TValue>;
  $queryRaw?(strings: TemplateStringsArray, ...values: readonly unknown[]): Promise<unknown>;
  $disconnect?(): Promise<void>;
}>;

export type PrismaTransactionClient = Omit<
  PrismaDatabaseClient,
  "$transaction" | "$queryRaw" | "$disconnect"
>;
