import { Test, TestingModule } from '@nestjs/testing';

import { ProblemTagsController } from './problem-tags.controller';
import { ProblemTagsService } from './problem-tags.service';

describe('ProblemTagsController', () => {
  let controller: ProblemTagsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProblemTagsController],
      providers: [ProblemTagsService],
    }).compile();

    controller = module.get<ProblemTagsController>(ProblemTagsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
