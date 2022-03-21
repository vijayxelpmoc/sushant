import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Length, IsNotEmpty, IsEmail, IsEnum } from 'class-validator';
import * as bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
}

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Column()
  @IsNotEmpty()
  @Length(8, 100)
  password: string;

  @Column()
  @Length(3, 20)
  name: string;

  @Column()
  @IsNotEmpty()
  organization: string;

  @Column()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: true })
  isRegisteredOnPalette: boolean;

  @Column({
    type: String,
    unique: true,
    nullable: true,
  })
  uuid: string | null;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 8);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
