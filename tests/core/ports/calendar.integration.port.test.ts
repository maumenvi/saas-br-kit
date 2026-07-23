import test from 'node:test';
import type { CalendarIntegrationPort } from '../../../src/core/ports/calendar.integration.port.ts';

test('declara o contrato de integração de calendário', () => {
  const port = undefined as CalendarIntegrationPort | undefined;
  void port;
});
