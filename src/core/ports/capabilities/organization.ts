import type { Organization } from "../../domain/index.ts";
import type { RepositoryOperationOptions } from "../repositories/options.ts";

export type OrganizationWriteCapabilitiesPort = Readonly<{
    insertOrganization(
        organization: Organization,
        options?: RepositoryOperationOptions,
    ): Promise<void>;
}>;
