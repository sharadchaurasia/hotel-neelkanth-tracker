export class CreateAgentDto {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  commissionPercentage?: number;
  status?: string;
}

export class UpdateAgentDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  commissionPercentage?: number;
  status?: string;
}
