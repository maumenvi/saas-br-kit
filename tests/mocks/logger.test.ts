import test from 'node:test';
import assert from 'node:assert/strict';
import { LoggerMock } from '../../src/mocks/logger.ts';

test('Encaminha mensagens para o console', () => {
  const logger = new LoggerMock();
  const calls: Array<{ level: string; args: unknown[] }> = [];
  const original = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  console.error = (...args) => calls.push({ level: 'error', args });
  console.warn = (...args) => calls.push({ level: 'warn', args });
  console.info = (...args) => calls.push({ level: 'info', args });
  console.debug = (...args) => calls.push({ level: 'debug', args });

  try {
    logger.error('error', 1);
    logger.warn('warn', 2);
    logger.info('info', 3);
    logger.debug('debug', 4);
  } finally {
    console.error = original.error;
    console.warn = original.warn;
    console.info = original.info;
    console.debug = original.debug;
  }

  assert.deepEqual(calls, [
    { level: 'error', args: ['error', 1] },
    { level: 'warn', args: ['warn', 2] },
    { level: 'info', args: ['info', 3] },
    { level: 'debug', args: ['debug', 4] },
  ]);
});
