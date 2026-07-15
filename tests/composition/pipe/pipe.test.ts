import test from 'node:test';
import assert from 'node:assert/strict';
import { pipe } from '../../../src/composition/pipe/pipe.ts';
import type { Handler, Interceptor } from '../../../src/core/shared/application/handler.ts';

class TraceInterceptor implements Interceptor<number, number> {
  private readonly name: string;
  private readonly trace: string[];

  constructor(name: string, trace: string[]) {
    this.name = name;
    this.trace = trace;
  }

  async intercept(input: number, next: Handler<number, number>): Promise<number> {
    this.trace.push(`${this.name}:before`);
    const output = await next(input);
    this.trace.push(`${this.name}:after`);
    return output;
  }
}

test('Executa diretamente o handler quando não existem interceptors', async () => {
  const handler: Handler<number, number> = async input => input * 2;

  const decoratedHandler = pipe(handler);

  assert.equal(await decoratedHandler(3), 6);
});

test('Executa interceptors na ordem declarada e retorna o resultado do handler', async () => {
  const trace: string[] = [];
  const handler: Handler<number, number> = async (input) => {
    trace.push('handler');
    return input * 2;
  };
  const decoratedHandler = pipe(
    handler,
    new TraceInterceptor('first', trace),
    new TraceInterceptor('second', trace),
  );

  assert.equal(await decoratedHandler(4), 8);
  assert.deepEqual(trace, [
    'first:before',
    'second:before',
    'handler',
    'second:after',
    'first:after',
  ]);
});

test('Interrompe a cadeia quando um interceptor não chama o próximo handler', async () => {
  let handlerExecutions = 0;
  const handler: Handler<number, number> = async input => {
    handlerExecutions += 1;
    return input;
  };
  const blocker: Interceptor<number, number> = {
    async intercept() {
      return 99;
    },
  };
  const decoratedHandler = pipe(handler, blocker);

  assert.equal(await decoratedHandler(1), 99);
  assert.equal(handlerExecutions, 0);
});
