import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { DaybookService } from './daybook.service';
import { CreateDaybookEntryDto, SetBalanceDto } from './dto/create-daybook.dto';
import { RequirePermissions } from '../auth/decorators';

@Controller('api/daybook')
export class DaybookController {
  constructor(private readonly daybookService: DaybookService) {}

  @Get('entries')
  @RequirePermissions('daybook', 'view')
  getEntries(@Query('date') date: string) {
    return this.daybookService.getEntries(date);
  }

  @Post('entries')
  @RequirePermissions('daybook', 'create')
  createEntry(@Body() dto: CreateDaybookEntryDto) {
    return this.daybookService.createEntry(dto);
  }

  @Delete('entries/:id')
  @RequirePermissions('daybook', 'delete')
  deleteEntry(@Param('id') id: string) {
    return this.daybookService.deleteEntry(+id);
  }

  @Get('balance')
  @RequirePermissions('daybook', 'view')
  getBalance(@Query('date') date: string) {
    return this.daybookService.getBalance(date);
  }

  @Put('balance')
  @RequirePermissions('daybook', 'edit')
  setBalance(@Body() dto: SetBalanceDto) {
    return this.daybookService.setBalance(dto);
  }

  @Get('closing')
  @RequirePermissions('daybook', 'view')
  getClosing(@Query('date') date: string) {
    return this.daybookService.getClosing(date);
  }

  @Post('auto-collect')
  @RequirePermissions('daybook', 'create')
  autoCollect(@Query('date') date: string) {
    return this.daybookService.autoCollect(date);
  }
}
