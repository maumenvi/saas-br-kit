src/
├── core/
│   ├── shared/
│   │   ├── domain/
│   │   │   ├── entity.ts
│   │   │   ├── value-object.ts
│   │   │   └── domain-error.ts
│   │   └── application/
│   │       └── ports/
│   │           ├── clock.port.ts
│   │           ├── id-generator.port.ts
│   │           ├── logger.port.ts
│   │           └── transaction.port.ts
│   │
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── events/
│   │   │   └── errors/
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   ├── ports/
│   │   │   └── dto/
│   │   └── index.ts
│   │
│   ├── organizations/
│   │   ├── domain/
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   ├── ports/
│   │   │   └── dto/
│   │   └── index.ts
│   │
│   ├── billing/
│   │   ├── domain/
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   ├── ports/
│   │   │   └── dto/
│   │   └── index.ts
│   │
│   └── index.ts
│
├── adapters/
│   ├── database-prisma/
│   │   ├── repositories/
│   │   ├── transaction/
│   │   ├── mappers/
│   │   └── index.ts
│   ├── runtime-nest/
│   │   ├── controllers/
│   │   ├── modules/
│   │   ├── presenters/
│   │   └── index.ts
│   ├── payment-asaas/
│   └── observability/
│       └── console-logger.adapter.ts
│
├── composition/
│   ├── contexts/
│   │   ├── technical.context.ts
│   │   ├── auth.context.ts
│   │   ├── organizations.context.ts
│   │   ├── billing.context.ts
│   │   └── app.context.ts
│   ├── builders/
│   │   ├── application.builder.ts
│   │   └── module.builder.ts
│   └── index.ts
│
└── index.ts