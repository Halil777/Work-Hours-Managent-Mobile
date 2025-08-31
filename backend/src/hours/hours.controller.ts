import { Controller, Get, Query } from '@nestjs/common';
import { HoursService } from './hours.service';

@Controller('hours')
export class HoursController {
  constructor(private readonly hoursService: HoursService) {}

  @Get('daily')
  daily(@Query('month') month: string) {
    return this.hoursService.daily(month);
  }

  @Get('summary')
  summary(@Query('month') month: string) {
    return this.hoursService.summary(month);
  }
}
