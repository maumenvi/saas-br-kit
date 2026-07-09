import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_ROUTE = "saas_br:is_public_route";

export const PublicRoute = () => SetMetadata(IS_PUBLIC_ROUTE, true);
