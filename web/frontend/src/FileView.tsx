import { Button, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";

export function FileView({ projectId, fileName }: { projectId: string, fileName: string }) {
    const [file, setFile] = useState("");
    useEffect(() => {
        (async () => {
            const response = await fetch(`/files/loadFile?id=${projectId}&fileName=${fileName}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
            const data = await response.text();
            setFile(data)
        })();
    }, []);
    const saveJSON = async () => {
        await fetch(`/files/saveFile?id=${projectId}&fileName=${fileName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: file
        });
    };
    return (
        <Textarea autosize resize="vertical" loading={file == ""} value={file} onChange={(event) => setFile(event.currentTarget.value)}
            bottomSection={
                <Button size="compact-sm" onClick={() => { saveJSON() }}>
                    Save
                </Button>
            }
        />
    );
}