import test from 'node:test';
import type { PermissionApplicationInput } from '../../../../src/composition/application/permission/permission.application.input.ts';
import type {
  Extras,
  Statuses,
} from './permission.application.support.ts';

test('Declara o input da aplicação protegida', () => {
  const input = undefined as
    | PermissionApplicationInput<Statuses, Extras>
    | undefined;
  void input;
});
