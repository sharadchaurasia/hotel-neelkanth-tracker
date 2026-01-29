import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsModule } from './bookings/bookings.module';
import { DaybookModule } from './daybook/daybook.module';
import { StaffModule } from './staff/staff.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || undefined,
      host: process.env.DATABASE_URL ? undefined : 'localhost',
      port: process.env.DATABASE_URL ? undefined : 5432,
      database: process.env.DATABASE_URL ? undefined : 'hotel_neelkanth',
      autoLoadEntities: true,
      synchronize: true,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    }),
    BookingsModule,
    DaybookModule,
    StaffModule,
    ReportsModule,
  ],
})
export class AppModule {}
