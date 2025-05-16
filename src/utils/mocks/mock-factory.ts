import { Repository } from 'typeorm';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(
  () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }),
);
