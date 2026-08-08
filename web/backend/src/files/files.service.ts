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
        try {
            return (await fs.readFile(filePath)).toString();
        } catch (e) {
            return "";
        }
    }
    async saveParameters(projectId: string, content: string) {
        await this.saveFile(projectId, "parameters.json", content)
    }
    async loadParameters(projectId: string): Promise<Params> {
        let file = await this.loadFile(projectId, "parameters.json");
        if (file.trim() == "") file = "{}"
        const a = JSON.parse(file); return a;
    }
    async listFiles(projectId: string) {
        const dirPath = this.getProjectPath(projectId);
        await fs.mkdir(dirPath, { recursive: true })
        return fs.readdir(dirPath);
    }
    async renameFile(projectId: string, orgFile: string, newFile: string) {
        const dirPath = this.getProjectPath(projectId);
        await fs.rename(join(dirPath, orgFile), join(dirPath, newFile));
    }
}
