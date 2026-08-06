import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
    constructor(private readonly fileService: FilesService) { }

    @Post("saveFile")
    async saveFile(@Query("id") projectId: string, @Query("fileName") fileName: string, @Body() content: string) {
        await this.fileService.saveFile(projectId, fileName, content);
    }
    @Get("loadFile")
    async loadFile(@Query("id") projectId: string, @Query("fileName") fileName: string) {
        return await this.fileService.loadFile(projectId, fileName);
    }
    @Post("saveParameters")
    async saveParameters(@Query("id") projectId: string, @Body() content: string) {
        await this.fileService.saveParameters(projectId, content);
    }
    @Get("loadParameters")
    async loadParameters(@Query("id") projectId: string) {
        return await this.fileService.loadParameters(projectId);
    }
    @Get("listFiles")
    async listFiles(@Query("id") projectId: string) {
        return await this.fileService.listFiles(projectId);
    }
}
