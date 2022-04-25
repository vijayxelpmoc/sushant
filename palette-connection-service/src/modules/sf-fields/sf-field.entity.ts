import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SFFieldEntity extends BaseEntity {
  constructor(partial: Partial<SFFieldEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  crmId: string;

  @Column()
  objectName: string;

  @Column()
  globalKeyname: string;

  @Column()
  crmKeyname: string;

  @Column()
  relatedToObject?: string;

  @Column()
  datatype: string;
}
