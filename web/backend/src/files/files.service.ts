import { Injectable } from '@nestjs/common';
import fs from "fs/promises";
import { join } from 'path';
import { Params } from './params.dto';
@Injectable()
export class FilesService {
    protected rootDirOfAllFiles: string = "./projects/";
    getProjectPath(projectId: string) {
        return join(this.rootDirOfAllFiles, projectId)
    }
    async saveFile(projectId: string, name: string, content: string) {
        const dirPath = this.getProjectPath(projectId);
        await fs.mkdir(dirPath, { recursive: true })
        const filePath = join(dirPath, name);
        await fs.writeFile(filePath, content);
    }
    async loadFile(projectId: string, name: string,) {
        const dirPath = this.getProjectPath(projectId);
        // await fs.mkdir(dirPath)
        const filePath = join(dirPath, name);
        return (await fs.readFile(filePath)).toString();
    }
    async saveParameters(projectId: string, content: string) {
        await this.saveFile(projectId, "parameters.json", content)
    }
    async loadParameters(projectId: string): Promise<Params> {
        const a=JSON.parse(await this.loadFile(projectId, "parameters.json"));
        return a;
    }
    async listFiles(projectId:string){
        return fs.readdir(this.getProjectPath(projectId));
    }
}
