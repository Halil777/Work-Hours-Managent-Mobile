import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequestsService, RequestType } from './requests.service';

class CreateRequestDto {
  type: RequestType;
  startDate: string;
  endDate: string;
}

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  list() {
    return this.requestsService.list();
  }

  @Post()
  create(@Body() dto: CreateRequestDto) {
    return this.requestsService.create(dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.requestsService.cancel(id);
  }
}
