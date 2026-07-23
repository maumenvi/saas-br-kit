import {
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ENTITY_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*$/;

function entityTypeName(name) {
  return name
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

function entityVariableName(name) {
  const typeName = entityTypeName(name);
  return typeName[0].toLowerCase() + typeName.slice(1);
}

function scaffoldFiles(name) {
  const typeName = entityTypeName(name);
  const variableName = entityVariableName(name);
  const useCase = (operation, method, repositoryMethod, returnType = 'Promise<void>') => `import type { ExecutionContext } from '../../../context/execution.context.ts';
import type { ${typeName}RepositoryPort } from '../${name}.repositories.ts';
import type { ${typeName} } from '../${name}.ts';

export class ${operation}${typeName}UseCase<Status, Extra = unknown> {
  private readonly executionContext: ExecutionContext;
  private readonly ${variableName}Repository: ${typeName}RepositoryPort<Status, Extra>;

  constructor(
    executionContext: ExecutionContext,
    ${variableName}Repository: ${typeName}RepositoryPort<Status, Extra>
  ) {
    this.executionContext = executionContext;
    this.${variableName}Repository = ${variableName}Repository;
  }

  async ${method}(${method === 'findById' ? 'id: string' : `${variableName}: ${typeName}<Status, Extra>`}): ${returnType} {
    ${returnType === 'Promise<void>' ? 'await ' : 'return await '}this.executionContext.databaseProvider.run(async () => {
      ${returnType === 'Promise<void>' ? 'await ' : 'return await '}this.${variableName}Repository.${repositoryMethod}(${method === 'findById' ? 'id' : variableName});
    });
  }
}
`;

  return new Map([
    [`application/${name}.create.ts`, useCase('Create', 'execute', 'save')],
    [`application/${name}.update.ts`, useCase('Update', 'update', 'update')],
    [`application/${name}.changeStatus.ts`, useCase('Change', 'changeStatus', 'changeStatus')
      .replace(`class Change${typeName}UseCase`, `class Change${typeName}StatusUseCase`)],
    [`application/${name}.find.ts`, useCase(
      'Find',
      'findById',
      'findById',
      `Promise<${typeName}<Status, Extra> | null>`,
    ).replace(`class Find${typeName}UseCase`, `class Find${typeName}ByIdUseCase`)],
    ['domain/.gitkeep', ''],
    [`${name}.ts`, `import type { EntityInput } from '../../shared/input/entity.input.ts';

export type ${typeName}<Status, Extra = unknown> = EntityInput<Status> & Extra;
`],
    [`${name}.repositories.ts`, `import type { RepositoryPort } from '../../ports/repositories.port.ts';
import type { ${typeName} } from './${name}.ts';

export interface ${typeName}RepositoryPort<Status, Extra = unknown>
  extends RepositoryPort<${typeName}<Status, Extra>> {}
`],
    ['index.ts', `export {
  type ${typeName},
} from './${name}.ts';

export {
  type ${typeName}RepositoryPort,
} from './${name}.repositories.ts';

export {
  Create${typeName}UseCase,
} from './application/${name}.create.ts';

export {
  Update${typeName}UseCase,
} from './application/${name}.update.ts';

export {
  Change${typeName}StatusUseCase,
} from './application/${name}.changeStatus.ts';

export {
  Find${typeName}ByIdUseCase,
} from './application/${name}.find.ts';
`],
  ]);
}

function scaffoldTests(name) {
  const typeName = entityTypeName(name);
  const variableName = entityVariableName(name);
  const placeholder = (source) => `import test from 'node:test';

test('Não necessita teste unitário', () => {
  console.log('Não é necessário teste unitário para ${source}: contém apenas tipos TypeScript.');
});
`;
  const useCaseTest = (filename, className, method, repositoryMethod, expected) => `import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '../../../../../src/core/context/execution.context.ts';
import { ${className} } from '../../../../../src/core/entities/${name}/application/${filename}.ts';
import type { ${typeName}RepositoryPort } from '../../../../../src/core/entities/${name}/${name}.repositories.ts';
import type { ${typeName} } from '../../../../../src/core/entities/${name}/${name}.ts';

test('${className} delega a operação ao repository', async () => {
  const ${variableName} = { id: '${name}-1', status: 'active' } as ${typeName}<'active'>;
  let received: ${method === 'findById' ? 'string | undefined' : `${typeName}<'active'> | undefined`};
  const repository = {
    ${repositoryMethod}: async (value: ${method === 'findById' ? 'string' : `${typeName}<'active'>`}) => {
      received = value;
      ${method === 'findById' ? `return ${variableName};` : ''}
    },
  } as unknown as ${typeName}RepositoryPort<'active'>;
  const executionContext = {
    databaseProvider: {
      run: async (callback: (transaction: unknown) => Promise<unknown>) => callback(undefined),
    },
  } as ExecutionContext;
  const useCase = new ${className}(executionContext, repository);

  ${method === 'findById' ? `const result = await useCase.${method}(${variableName}.id);` : `await useCase.${method}(${variableName});`}

  assert.equal(received, ${expected});
  ${method === 'findById' ? `assert.equal(result, ${variableName});` : ''}
});
`;

  return new Map([
    [`application/${name}.create.test.ts`, useCaseTest(
      `${name}.create`,
      `Create${typeName}UseCase`,
      'execute',
      'save',
      variableName,
    )],
    [`application/${name}.update.test.ts`, useCaseTest(
      `${name}.update`,
      `Update${typeName}UseCase`,
      'update',
      'update',
      variableName,
    )],
    [`application/${name}.changeStatus.test.ts`, useCaseTest(
      `${name}.changeStatus`,
      `Change${typeName}StatusUseCase`,
      'changeStatus',
      'changeStatus',
      variableName,
    )],
    [`application/${name}.find.test.ts`, useCaseTest(
      `${name}.find`,
      `Find${typeName}ByIdUseCase`,
      'findById',
      'findById',
      `${variableName}.id`,
    )],
    ['domain/.gitkeep', ''],
    [`${name}.test.ts`, placeholder(`src/core/entities/${name}/${name}.ts`)],
    [`${name}.repositories.test.ts`, placeholder(`src/core/entities/${name}/${name}.repositories.ts`)],
    ['index.test.ts', `import assert from 'node:assert/strict';
import test from 'node:test';
import {
  Change${typeName}StatusUseCase,
  Create${typeName}UseCase,
  Find${typeName}ByIdUseCase,
  Update${typeName}UseCase,
} from '../../../../src/core/entities/${name}/index.ts';

test('Exporta os casos de uso do módulo ${typeName}', () => {
  assert.equal(typeof Change${typeName}StatusUseCase, 'function');
  assert.equal(typeof Create${typeName}UseCase, 'function');
  assert.equal(typeof Find${typeName}ByIdUseCase, 'function');
  assert.equal(typeof Update${typeName}UseCase, 'function');
});
`],
  ]);
}

export function generateEntity(name, projectRoot = process.cwd()) {
  if (!ENTITY_NAME_PATTERN.test(name)) {
    throw new Error('O nome deve estar em kebab-case, por exemplo: service-plan.');
  }

  const sourceRoot = join(projectRoot, 'src/core/entities', name);
  const testRoot = join(projectRoot, 'tests/core/entities', name);

  if (existsSync(sourceRoot) || existsSync(testRoot)) {
    throw new Error(`A entidade "${name}" já possui uma estrutura em src ou tests.`);
  }

  const structures = [
    [sourceRoot, scaffoldFiles(name)],
    [testRoot, scaffoldTests(name)],
  ];

  for (const [root, files] of structures) {
    for (const [relativePath, contents] of files) {
      const target = join(root, relativePath);
      mkdirSync(resolve(target, '..'), { recursive: true });
      writeFileSync(target, contents, { encoding: 'utf8', flag: 'wx' });
    }
  }

  return { sourceRoot, testRoot };
}

function printUsage() {
  console.log('Uso: npm run generate:entity -- <nome-em-kebab-case>');
}

const isMain = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const [name] = process.argv.slice(2);

  if (!name || name === '--help') {
    printUsage();
    process.exitCode = name ? 0 : 1;
  } else {
    try {
      const result = generateEntity(name);
      console.log(`Entidade "${name}" criada em:`);
      console.log(`- ${result.sourceRoot}`);
      console.log(`- ${result.testRoot}`);
    } catch (error) {
      console.error(error.message);
      printUsage();
      process.exitCode = 1;
    }
  }
}