import { Injectable } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class RunService {
    constructor(private readonly fileService: FilesService) { }
    private childProcesses: Record<string, ChildProcess> = {};

    async waitForProcess(
        child: ChildProcess,
    ): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
        return new Promise((resolve) => {
            if (child.exitCode !== null) {
                resolve({ code: child.exitCode, signal: null });
                return;
            }
            child.on("exit", (code, signal) => {
                resolve({ code, signal });
            });
        });
    }

    async runTest(projectId: string): Promise<number> {
        try {
            const childProcess = this.childProcesses[projectId];
            const { jsFile, cppFile, args: argus, flags } = await this.fileService.loadParameters(projectId);
            if (childProcess && childProcess.exitCode === null) {
                console.log(`Killing ${childProcess.pid}`);
                childProcess.kill();
                await this.waitForProcess(childProcess);
            }
            const args = Object.entries(argus).map(([key, value]) => `${key}=${value}`);
            console.log(
                `>>> ${"Running"} ${jsFile} ${args}`,
            );

            this.childProcesses[projectId] = spawn(
                "codetest",
                [jsFile, `CPP=${cppFile}`, ...args, ...flags],
                {
                    stdio: "inherit", //TODO: make it with pipe and SSE
                    cwd: this.fileService.getProjectPath(projectId),
                },
            );
            // console.log(
            //     `>>> ${testScriptPath} exited with code ${code === 0 ? chalk.green(code.toString()) : chalk.red(code?.toString())}`,
            // );
            return 0;
        } catch (e) {
            console.error("Error running test:");
            console.error(e);
            const err = e as Error & { status?: number };
            throw e
        }
    }
    async kill(projectId: string) {
        console.log("Kill!!!")
        if (this.childProcesses[projectId]) this.childProcesses[projectId].kill();
    }
}

