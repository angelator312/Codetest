import { Button, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import Editor from '@monaco-editor/react';

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
        <>
            <Editor language={fileName.endsWith(".js") ? "javascript" : "cpp"} height="60vh" loading={file == ""} value={file} onChange={(event) => setFile(event ?? "")}
            />
            <Button size="compact-sm" onClick={() => { saveJSON() }}>
                Save
            </Button>
        </>
    );
}