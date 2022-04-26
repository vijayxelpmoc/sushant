import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { CreateSFCredentialDto } from './dto/create-sf-credential.dto';
import { SFCredentialEntity } from './sf-credential.entity';

@Injectable()
export class SFCredentialsService {
  constructor(
    @InjectRepository(SFCredentialEntity)
    private sfCredentialsRepository: Repository<SFCredentialEntity>,
  ) {}

  async get(): Promise<SFCredentialEntity[]> {
    return this.sfCredentialsRepository.find();
  }

  async getById(id: string): Promise<SFCredentialEntity> {
    const found = await this.sfCredentialsRepository.findOne({
      where: { instituteId: id },
    });
    if (!found) {
      throw new NotFoundException(
        `SF credentials with id "${id}" were not found`,
      );
    }
    return found;
  }

  async create(data: CreateSFCredentialDto[]): Promise<any> {
    for (const entry of data) {
      await this.sfCredentialsRepository
        .create({
          ...entry,
          instituteId: uuid(),
        })
        .save();
    }
    return { statusCode: 201, message: 'success' };
  }

  async update(
    id: number,
    data: Partial<CreateSFCredentialDto>,
  ): Promise<SFCredentialEntity> {
    const creds = await this.getById(id);
    return await this.sfCredentialsRepository.save({
      ...creds,
      ...data,
    });
  }

  //
  async delete(id: number): Promise<void> {
    const result = await this.sfCredentialsRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Unable to delete, no creds with ${id} was found`,
      );
    }
  }

  async load(): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reader = require('xlsx');

    // Reading SFCredentials file
    const file = reader.readFile('src/data/SFCredentials.xlsx');
    const sheets = file.SheetNames;

    const data: any = [];
    for (let i = 0; i < sheets.length; i++) {
      const temp = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
      temp.forEach((res: any) => {
        data.push(res);
      });
    }
    // Bulk insert using query builder
    await this.sfCredentialsRepository
      .createQueryBuilder()
      .insert()
      .values(data)
      .execute();

    return { status: 201, message: 'Success' };
  }
}
