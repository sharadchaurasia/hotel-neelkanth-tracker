import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './agent.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto/create-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentRepo: Repository<Agent>,
  ) {}

  async findAll(): Promise<Agent[]> {
    return this.agentRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Agent> {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return agent;
  }

  async create(dto: CreateAgentDto): Promise<Agent> {
    const existing = await this.agentRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Agent with this name already exists');
    }
    const agent = this.agentRepo.create(dto);
    return this.agentRepo.save(agent);
  }

  async update(id: number, dto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.findOne(id);

    if (dto.name && dto.name !== agent.name) {
      const existing = await this.agentRepo.findOne({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException('Agent with this name already exists');
      }
    }

    Object.assign(agent, dto);
    return this.agentRepo.save(agent);
  }

  async delete(id: number): Promise<void> {
    const agent = await this.findOne(id);
    await this.agentRepo.remove(agent);
  }
}
