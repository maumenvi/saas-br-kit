import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client.ts";
import { prismaDatabaseAdapter } from "../../../src/adapters/database-prisma/prisma-database-adapter.ts";

const driver = new PrismaPg({
  connectionString: "postgresql://saas_br:saas_br_dev@localhost:5432/saas_br",
});
const client = new PrismaClient({ adapter: driver });

prismaDatabaseAdapter(client);
