import test from 'node:test';
import type { PublicApplicationInput } from '../../../../src/composition/application/public/public.application.input.ts';
import type {
  Extras,
  Statuses,
} from './public.application.support.ts';

test('Declara o input da aplicação pública', () => {
  const input = undefined as
    | PublicApplicationInput<string, Statuses, Extras>
    | undefined;
  void input;
});
