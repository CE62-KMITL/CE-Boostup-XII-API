import { Test, TestingModule } from '@nestjs/testing';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';

describe('ProblemsController', () => {
  let controller: ProblemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProblemsController],
      providers: [ProblemsService],
    }).compile();

    controller = module.get<ProblemsController>(ProblemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
