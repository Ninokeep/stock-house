import { Length } from 'class-validator';

export class CreateTodoDto {
  @Length(10)
  title: string;

  @Length(10)
  description: string;
}
