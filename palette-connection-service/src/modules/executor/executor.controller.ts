import { Body, Controller, Post } from '@nestjs/common';

import { ExecutorService } from './executor.service';
import { ExecutorRequestDto } from './dto/executor-request.dto';

@Controller({
  path: 'con/service/executor',
})
export class ExecutorController {
  constructor(private executorService: ExecutorService) {}

  @Post()
  async execute(@Body() executorRequestDto: ExecutorRequestDto) {
    return await this.executorService.execute(executorRequestDto);
  }
}
