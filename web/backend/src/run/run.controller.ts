import { Controller, Get, Query } from '@nestjs/common';
import { RunService } from './run.service';

@Controller('run')
export class RunController {
    constructor(private readonly runService: RunService) { }

    @Get("runTest")
    async runTest(@Query("id") projectId: string) {
        return await this.runService.runTest(projectId);
    }
    @Get("kill")
    async kill(@Query("id") projectId: string) {
        return await this.runService.kill(projectId);
    }
}
