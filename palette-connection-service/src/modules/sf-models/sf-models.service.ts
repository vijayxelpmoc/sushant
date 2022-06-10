import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateSFModelDto } from './dto/create-sf-model.dto';
import { SFModelEntity } from './sf-model.entity';

@Injectable()
export class SFModelsService {
  constructor(
    @InjectRepository(SFModelEntity)
    private sfModelRepository: Repository<SFModelEntity>,
  ) {}

  async get(): Promise<SFModelEntity[]> {
    return await this.sfModelRepository.find();
  }

  async getById(id: number): Promise<SFModelEntity> {
    const found = await this.sfModelRepository.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`SF model with id "${id}" was not found`);
    }
    return found;
  }

  async create(data: CreateSFModelDto[]): Promise<any> {
    for (const entry of data) {
      await this.sfModelRepository.create(entry).save();
    }
    return { statusCode: 201, message: 'success' };
  }

  async update(id: number, data: Partial<CreateSFModelDto>): Promise<any> {
    const model = await this.getById(id);

    return await this.sfModelRepository.save({
      ...model,
      ...data,
    });
  }

  async load(): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reader = require('xlsx');

    const file = reader.readFile('src/data/SFModels.xlsx');
    const sheets = file.SheetNames;

    const data: any = [];
    for (let i = 0; i < sheets.length; i++) {
      const temp = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
      temp.forEach((res: any) => {
        data.push(res);
      });
    }

    // Bulk insert using query builder
    await this.sfModelRepository
      .createQueryBuilder()
      .insert()
      .values(data)
      .execute();

    return { status: 201, message: 'Success' };
  }

  async loadPAWSmodels(instituteId: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reader = require('xlsx');

    const file = reader.readFile('src/data/PAWSModels.xlsx');
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
    await this.sfModelRepository
      .createQueryBuilder()
      .insert()
      .values(data)
      .execute();

    return { status: 201, message: 'Success' };
  }
}
