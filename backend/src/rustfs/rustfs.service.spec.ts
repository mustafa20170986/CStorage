import { Test, TestingModule } from '@nestjs/testing';
import { RustfsService } from './rustfs.service';

describe('RustfsService', () => {
  let service: RustfsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RustfsService],
    }).compile();

    service = module.get<RustfsService>(RustfsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
