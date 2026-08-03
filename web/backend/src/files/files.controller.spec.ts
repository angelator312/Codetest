import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(controller.saveFile()).toBe('Hello World!');
    });
  });
});
