import { Test, TestingModule } from '@nestjs/testing';
import { SavesService } from './saves.service';

describe('SavesService', () => {
  let service: SavesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavesService],
    }).compile();

    service = module.get<SavesService>(SavesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
