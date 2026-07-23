import assert from 'node:assert/strict';
import test from 'node:test';
import { AnonymizeCustomerUseCase } from '../../../../../src/core/entities/customer/application/customer.anonymize.ts';
import { setup, customer } from '../../appointment/application/appointment.support.ts';

test('persiste a anonimização dos dados sensíveis', async () => {
  const context = setup();
  const useCase = new AnonymizeCustomerUseCase(
    context.executionContext,
    context.customerRepository,
  );
  context.customerRepository.customers[0] = {
    ...customer,
    document: '12345678900',
    documentType: 'cpf',
  };

  await useCase.execute({
    customerId: customer.id,
    organizationId: customer.organizationId,
  });

  const saved = context.customerRepository.customers[0]!;
  assert.equal(saved.email.endsWith('om'), true);
  assert.equal(saved.telephone.endsWith('99'), true);
  assert.equal(saved.document, '*********00');
});
