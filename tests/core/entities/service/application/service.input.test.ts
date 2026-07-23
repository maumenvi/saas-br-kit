import test from 'node:test';
import type { CreateServiceInput } from '../../../../../src/core/entities/service/application/service.input.ts';

test('declara o input de criação de service', () => {
  const input = undefined as CreateServiceInput<string> | undefined;
  void input;
});
