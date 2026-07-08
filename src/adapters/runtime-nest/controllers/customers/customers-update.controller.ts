import { Body, Controller, Inject, Param, Patch, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UpdateCustomerUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { TrustedOrganizationResolver } from "../../context/trusted-organization.resolver.ts";
import { UpdateCustomerBodyDto } from "../../dto/customer.dto.ts";
import { CustomerResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";

@ApiTags("customers")
@Controller("customers")
export class CustomersUpdateController {
  private readonly options: SaasBrNestOptions;
  private readonly trustedOrganizationResolver: TrustedOrganizationResolver;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
    this.trustedOrganizationResolver = new TrustedOrganizationResolver(options.appContext);
  }

  @Patch(":customerId")
  @ApiOkResponse({ type: CustomerResponseDto })
  async update(
    @Param("customerId") customerId: string,
    @Body() body: UpdateCustomerBodyDto,
    @Req() request: NestRequestLike,
  ) {
    const { organizationId } = await this.trustedOrganizationResolver.resolve(request);
    return nestHttpErrorMapper.unwrap(
      await new UpdateCustomerUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, {
          organizationId,
          permissions: ["customers:write"],
        }),
        { organizationId, customerId, ...body },
      ),
    );
  }
}
