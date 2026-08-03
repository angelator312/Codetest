import { Module } from '@nestjs/common';
import { RunController } from './run.controller';
import { RunService } from './run.service';
import { FilesModule } from "../files/files.module"
@Module({
  imports: [FilesModule],
  controllers: [RunController],
  providers: [RunService]
})
export class RunModule { }
