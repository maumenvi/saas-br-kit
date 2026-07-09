import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { SaasBrNestOptions } from "../module/options.ts";
import { SaasBrModule } from "../module/saas-br.module.ts";

export type CreateSaasBrNestTestAppInput = Readonly<{
  configure?: (app: INestApplication) => void;
}>;

/** Creates a Nest test app with the SaaS BR module registered. */
export async function createSaasBrNestTestApp(
  options: SaasBrNestOptions,
  input: CreateSaasBrNestTestAppInput = {},
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [SaasBrModule.forRoot(options)],
  }).compile();
  const app = moduleRef.createNestApplication();
  input.configure?.(app);
  await app.init();
  return app;
}
