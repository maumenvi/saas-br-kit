import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { generateEntity } from './generate-entity.mjs';

test('cria a estrutura de fonte e testes para uma entidade', () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'saas-br-kit-generator-'));

  try {
    generateEntity('service-plan', projectRoot);

    const sourceRoot = join(projectRoot, 'src/core/entities/service-plan');
    const testRoot = join(projectRoot, 'tests/core/entities/service-plan');

    assert.equal(existsSync(join(sourceRoot, 'application/service-plan.create.ts')), true);
    assert.equal(existsSync(join(sourceRoot, 'application/service-plan.update.ts')), true);
    assert.equal(existsSync(join(sourceRoot, 'application/service-plan.changeStatus.ts')), true);
    assert.equal(existsSync(join(sourceRoot, 'application/service-plan.find.ts')), true);
    assert.equal(existsSync(join(sourceRoot, 'application/service-plan.findById.ts')), false);
    assert.equal(existsSync(join(sourceRoot, 'domain/.gitkeep')), true);
    assert.equal(existsSync(join(testRoot, 'application/service-plan.create.test.ts')), true);
    assert.equal(existsSync(join(testRoot, 'application/service-plan.update.test.ts')), true);
    assert.equal(existsSync(join(testRoot, 'application/service-plan.changeStatus.test.ts')), true);
    assert.equal(existsSync(join(testRoot, 'application/service-plan.find.test.ts')), true);
    assert.equal(existsSync(join(testRoot, 'domain/.gitkeep')), true);
    assert.match(
      readFileSync(join(sourceRoot, 'service-plan.ts'), 'utf8'),
      /export type ServicePlan<Status, Extra = unknown>/,
    );
    assert.match(
      readFileSync(join(sourceRoot, 'service-plan.repositories.ts'), 'utf8'),
      /export interface ServicePlanRepositoryPort/,
    );
    assert.match(
      readFileSync(join(sourceRoot, 'application/service-plan.create.ts'), 'utf8'),
      /export class CreateServicePlanUseCase/,
    );
    assert.match(
      readFileSync(join(sourceRoot, 'application/service-plan.find.ts'), 'utf8'),
      /Promise<ServicePlan<Status, Extra> \| null>/,
    );
    assert.match(
      readFileSync(join(sourceRoot, 'index.ts'), 'utf8'),
      /ChangeServicePlanStatusUseCase/,
    );
    assert.equal(existsSync(join(testRoot, 'service-plan.test.ts')), true);
    assert.equal(existsSync(join(testRoot, 'service-plan.repositories.test.ts')), true);
    assert.equal(existsSync(join(testRoot, 'index.test.ts')), true);
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test('rejeita nomes fora de kebab-case', () => {
  assert.throws(
    () => generateEntity('ServicePlan'),
    /O nome deve estar em kebab-case/,
  );
});

test('não sobrescreve uma estrutura existente', () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'saas-br-kit-generator-'));

  try {
    generateEntity('account', projectRoot);

    assert.throws(
      () => generateEntity('account', projectRoot),
      /já possui uma estrutura/,
    );
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});