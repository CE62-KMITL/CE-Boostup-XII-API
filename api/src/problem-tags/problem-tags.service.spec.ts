import { Test, TestingModule } from '@nestjs/testing';
import { ProblemTagsService } from './problem-tags.service';

describe('ProblemTagsService', () => {
  let service: ProblemTagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProblemTagsService],
    }).compile();

    service = module.get<ProblemTagsService>(ProblemTagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
