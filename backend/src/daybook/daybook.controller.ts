import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { DaybookService } from './daybook.service';
import { CreateDaybookEntryDto, SetBalanceDto } from './dto/create-daybook.dto';

@Controller('api/daybook')
export class DaybookController {
  constructor(private readonly daybookService: DaybookService) {}

  @Get('entries')
  getEntries(@Query('date') date: string) {
    return this.daybookService.getEntries(date);
  }

  @Post('entries')
  createEntry(@Body() dto: CreateDaybookEntryDto) {
    return this.daybookService.createEntry(dto);
  }

  @Delete('entries/:id')
  deleteEntry(@Param('id') id: string) {
    return this.daybookService.deleteEntry(+id);
  }

  @Get('balance')
  getBalance(@Query('date') date: string) {
    return this.daybookService.getBalance(date);
  }

  @Put('balance')
  setBalance(@Body() dto: SetBalanceDto) {
    return this.daybookService.setBalance(dto);
  }

  @Get('closing')
  getClosing(@Query('date') date: string) {
    return this.daybookService.getClosing(date);
  }

  @Post('auto-collect')
  autoCollect(@Query('date') date: string) {
    return this.daybookService.autoCollect(date);
  }
}
