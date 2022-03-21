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

import { OtpChecks } from '@src/modules/auth/types';

@Entity()
export class OtpManager extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  userId: string;

  @Column()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Column()
  @IsNotEmpty()
  @Length(6)
  otp: string;

  @Column()
  @IsNotEmpty()
  @IsEnum(OtpChecks)
  for: OtpChecks;

  @Column()
  senderValidationId: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  // Hashing OTP for security reasons. Only the end user should be able to see the
  // non hashed otp value.
  async hashOtp() {
    this.otp = await bcrypt.hash(this.otp, 8);
  }

  async validateOtp(otp: string): Promise<boolean> {
    return bcrypt.compare(otp, this.otp);
  }
}
