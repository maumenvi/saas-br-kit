import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export type SetupSaasBrDocInput = Readonly<{
  title?: string;
  description?: string;
  version?: string;
  path?: string;
  openApiPath?: string;
  swaggerPath?: string | false;
}>;

export type SetupSaasBrSwaggerInput = SetupSaasBrDocInput;

/** Configures an OpenAPI document with Scalar as the default reference UI. */
export function setupSaasBrDocs(app: INestApplication, input: SetupSaasBrDocInput = {}): void {
  const config = new DocumentBuilder()
    .setTitle(input.title ?? "SaaS BR API")
    .setDescription(input.description ?? "SaaS BR Kit runtime API")
    .setVersion(input.version ?? "0.0.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const docsPath = `/${input.path ?? "docs"}`;
  const openApiPath = `/${input.openApiPath ?? "openapi.json"}`;
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get(openApiPath, (_request: unknown, response: unknown) =>
    httpAdapter.reply(response, document, 200),
  );
  httpAdapter.get(docsPath, (_request: unknown, response: unknown) => {
    httpAdapter.setHeader(response, "content-type", "text/html; charset=utf-8");
    return httpAdapter.reply(
      response,
      `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.title ?? "SaaS BR API"}</title>
  </head>
  <body>
    <script id="api-reference" data-url="${openApiPath}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`,
      200,
    );
  });
  if (input.swaggerPath !== false) {
    SwaggerModule.setup(input.swaggerPath ?? "swagger", app, document);
  }
}

export const setupSaasBrSwagger = setupSaasBrDocs;
