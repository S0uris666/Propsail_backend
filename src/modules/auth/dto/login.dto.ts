import {
  IsEmail,
  IsLowercase,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @IsLowercase()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
