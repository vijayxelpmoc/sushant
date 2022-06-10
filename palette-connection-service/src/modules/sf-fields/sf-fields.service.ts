import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateSFFieldDto } from './dto/create-sf-field.dto';
import { SFFieldEntity } from './sf-field.entity';

@Injectable()
export class SFFieldsService {
  constructor(
    @InjectRepository(SFFieldEntity)
    private sfFieldsRepository: Repository<SFFieldEntity>,
  ) {}

  async get(): Promise<SFFieldEntity[]> {
    return await this.sfFieldsRepository.find();
  }

  async getById(id: number): Promise<SFFieldEntity> {
    const found = await this.sfFieldsRepository.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`SF field with id "${id}" was not found`);
    }
    return found;
  }

  async deleteAll() {
    for (let id = 3954; id <= 3988; id++) {
      console.log('id', id);
      await this.sfFieldsRepository.delete({ id });
    }
    return 'Done';
  }

  async create(data: CreateSFFieldDto[]): Promise<any> {
    for (const entry of data) {
      await this.sfFieldsRepository.create(entry).save();
    }
    return { statusCode: 201, message: 'success' };
  }

  async update(id: number, data: Partial<CreateSFFieldDto>): Promise<any> {
    const field = await this.getById(id);
    return await this.sfFieldsRepository.save({
      ...field,
      ...data,
    });
  }

  async load(): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reader = require('xlsx');

    const file = reader.readFile('src/data/SFFields.xlsx');
    const sheets = file.SheetNames;

    const data: any = [];
    for (let i = 0; i < sheets.length; i++) {
      const temp = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
      temp.forEach((res: any) => {
        data.push(res);
      });
    }
    // Bulk insert using query builder
    await this.sfFieldsRepository
      .createQueryBuilder()
      .insert()
      .values(data)
      .execute();

    return { status: 201, message: 'Success' };
  }

  async loadPAWSFields(instituteId: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reader = require('xlsx');

    const file = reader.readFile('src/data/PAWSFields.xlsx');
    const sheets = file.SheetNames;

    const data: any = [];
    for (let i = 0; i < sheets.length; i++) {
      const temp = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
      temp.forEach((res: any) => {
        res['crmId'] = instituteId;
        data.push(res);
      });
    }

    // Bulk insert using query builder
    await this.sfFieldsRepository
      .createQueryBuilder()
      .insert()
      .values(data)
      .execute();

    return { status: 201, message: 'Success' };
  }
}
