import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

const normalizeEmail = (v: unknown) =>
  typeof v === 'string' ? v.trim().toLowerCase() : v;

const sanitize = (v: unknown) => (typeof v === 'string' ? v.trim() : v);
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => normalizeEmail(value))
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Transform(({ value }) => sanitize(value))
  password: string;
}
