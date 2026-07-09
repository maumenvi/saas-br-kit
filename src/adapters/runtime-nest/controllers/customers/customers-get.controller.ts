import { Controller, Get, Inject, Param, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { GetCustomerUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { TrustedOrganizationResolver } from "../../context/trusted-organization.resolver.ts";
import { CustomerResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("customers")
@Controller("customers")
export class CustomersGetController {
  private readonly options: SaasBrNestOptions;
  private readonly trustedOrganizationResolver: TrustedOrganizationResolver;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
    this.trustedOrganizationResolver = new TrustedOrganizationResolver(options.appContext);
  }

  @Get(":customerId")
  @ApiOkResponse({ type: CustomerResponseDto })
  async get(@Param("customerId") customerId: string, @Req() request: NestRequestLike) {
    const { organizationId } = await this.trustedOrganizationResolver.resolve(request);
    return nestHttpErrorMapper.unwrap(
      await new GetCustomerUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, {
          organizationId,
          permissions: ["customers:read"],
        }),
        { organizationId, customerId },
      ),
    );
  }
}
