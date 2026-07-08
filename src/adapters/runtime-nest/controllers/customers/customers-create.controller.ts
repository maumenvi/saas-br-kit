import { Body, Controller, Inject, Post, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { createCustomerInputSchema } from "#contracts";
import { CreateCustomerUseCase } from "#core";
import {
  type NestRequestLike,
  nestExecutionContextFactory,
} from "../../context/execution-context.factory.ts";
import { TrustedOrganizationResolver } from "../../context/trusted-organization.resolver.ts";
import { CreateCustomerBodyDto } from "../../dto/customer.dto.ts";
import { CustomerResponseDto } from "../../dto/response.dto.ts";
import { nestHttpErrorMapper } from "../../errors/http-error-mapper.ts";
import type { SaasBrNestOptions } from "../../module/options.ts";
import { SAAS_BR_NEST_OPTIONS } from "../../module/tokens.ts";
import { nestContractValidation } from "../../validation/contract-validation.ts";

@ApiTags("customers")
@Controller("customers")
export class CustomersCreateController {
  private readonly options: SaasBrNestOptions;
  private readonly trustedOrganizationResolver: TrustedOrganizationResolver;

  constructor(@Inject(SAAS_BR_NEST_OPTIONS) options: SaasBrNestOptions) {
    this.options = options;
    this.trustedOrganizationResolver = new TrustedOrganizationResolver(options.appContext);
  }

  @Post()
  @ApiCreatedResponse({ description: "Organization customer created.", type: CustomerResponseDto })
  async create(@Body() body: CreateCustomerBodyDto, @Req() request: NestRequestLike) {
    const { organizationId } = await this.trustedOrganizationResolver.resolve(request);
    const input = nestContractValidation.parse(createCustomerInputSchema, {
      ...body,
      organizationId,
    });
    return nestHttpErrorMapper.unwrap(
      await new CreateCustomerUseCase(this.options.appContext).execute(
        nestExecutionContextFactory.create(request, {
          organizationId,
          permissions: ["customers:write"],
        }),
        input,
      ),
    );
  }
}
