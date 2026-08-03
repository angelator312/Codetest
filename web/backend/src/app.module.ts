import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesModule } from './files/files.module';
import { RunModule } from './run/run.module';

@Module({
  imports: [FilesModule, RunModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
