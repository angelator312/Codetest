import { Textarea } from "@mantine/core";
import { useState } from "react";

export function FileView({ projectId, fileName }: { projectId: string, fileName: string }) {
    const [file, setFile] = useState(fileName);
    return (
        <Textarea value={file} onChange={(event) => setFile(event.currentTarget.value)}/>
    );
}