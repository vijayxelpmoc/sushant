// import { ApiProperty } from '@nestjs/swagger';
// import { IsEmail, IsNotEmpty, Length, IsEnum } from 'class-validator';

// import { UserRole } from '../entities/user.entity';

// export class CreateUserDto {
//   @IsEmail()
//   @ApiProperty({ type: String })
//   email: string;

//   @IsNotEmpty()
//   @Length(8, 100)
//   @ApiProperty({ type: String })
//   password: string;

//   @IsNotEmpty()
//   @Length(3, 20)
//   @ApiProperty({ type: String })
//   name: string;

//   @IsNotEmpty()
//   @ApiProperty({ type: String })
//   organization: string;

//   @IsNotEmpty()
//   @IsEnum(UserRole)
//   @ApiProperty({ enum: UserRole })
//   role: UserRole;

//   @IsNotEmpty()
//   @ApiProperty({ type: Boolean })
//   isRegisteredOnPalette: boolean;

//   @ApiProperty({ type: String })
//   uuid: string;
// }
