import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/create-agent.dto';

// IMPORTANT: Do NOT add 'api/' prefix here
// Global prefix 'api' is set in main.ts
// This becomes /api/agents automatically
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(+id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.agentsService.delete(+id);
    return { message: 'Agent deleted successfully' };
  }
}
