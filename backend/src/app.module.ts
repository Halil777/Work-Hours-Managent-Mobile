import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HoursModule } from './hours/hours.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [AuthModule, HoursModule, RequestsModule],
})
export class AppModule {}
