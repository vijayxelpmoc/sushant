import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SFCredentialEntity extends BaseEntity {
  constructor(partial: Partial<SFCredentialEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  instituteName: string;

  @Column()
  instituteId: string;

  @Column()
  loginUrl?: string;

  @Column()
  clientId: string;

  @Column()
  clientSecret: string;

  @Column()
  redirectUri: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  grantType: string;

  @Column({ nullable: true })
  baseCrmId: string;
}
