import { useEffect, useState } from "react";

export interface RunLogProps {
    projectId: string;
    runId: string | number;
}

export function RunLog({projectId, runId}: RunLogProps) {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if(!runId) return;
        console.log(`Starting run with id ${runId} for project ${projectId}`);
        const eventSource = new EventSource(`/run/runTest?id=${projectId}`);
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.out) {
                setLogs((prevLogs) => [...prevLogs, data.out]);
            }
            if (data.err) {
                setLogs((prevLogs) => [...prevLogs, data.err]);
            }
            if (data.code !== undefined) {
                console.log(`Process exited with code ${data.code}`);
                eventSource.close();
            }
        };


        return () => {
            console.log(`Stopping run with id ${runId} for project ${projectId}`);
            eventSource.close();
        };
    }, [projectId, runId]);

    return (
        <pre>
            {logs.join("")}
        </pre>
    )
}