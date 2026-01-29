export class CreateStaffDto {
  name: string;
  designation?: string;
  salary?: number;
  doj?: string;
}

export class CreateAttendanceDto {
  staffId: number;
  date: string;
  absent?: boolean;
  remark?: string;
}

export class CreateAdvanceDto {
  staffId: number;
  amount: number;
  date: string;
  deductMonth?: string;
  remarks?: string;
}

export class FnfDto {
  lastWorkingDate: string;
}
