import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SFModelEntity extends BaseEntity {
  constructor(partial: Partial<SFModelEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  crmId?: string;

  @Column()
  objectGlobalKeyname?: string;

  @Column()
  objectCrmKeyname?: string;
}
