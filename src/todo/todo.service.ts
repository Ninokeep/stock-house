import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './entities/todo.entity';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    return await this.todoRepository.save(createTodoDto);
  }

  async findAll() {
    return await this.todoRepository.find();
  }

  async findOne(id: number) {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) {
      throw new HttpException("Todo doesn't exist", HttpStatus.NOT_FOUND);
    }
    return todo;
  }

  async update(id: number, updateTodoDto: UpdateTodoDto) {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) {
      throw new HttpException("Todo doesn't exist", HttpStatus.NOT_FOUND);
    }

    const invalidProps = Object.keys(updateTodoDto).filter(
      (item) => !CreateTodoDto.getPropertyNames().includes(item),
    );

    if (invalidProps.length > 0) {
      throw new BadRequestException();
    }

    await this.todoRepository.update(id, updateTodoDto);
    return { ...todo, ...updateTodoDto };
  }

  async remove(id: number) {
    const todo = await this.todoRepository.findOneBy({ id });

    if (todo === null) {
      throw new HttpException("User doesn't exist", HttpStatus.NOT_FOUND);
    }

    await this.todoRepository.delete(id);
    return {};
  }
}
