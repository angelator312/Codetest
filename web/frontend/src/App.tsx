import { useEffect, useState } from 'react'
import './App.css'
import { Button, MantineProvider, Splitter, Tabs } from '@mantine/core'
import '@mantine/core/styles.css';
import { RunLog } from './RunLog';
import { ParamsTab } from './ParamsTab';
import { FileView } from './FileView';
function App() {
  const projectId = new URLSearchParams(window.location.search).get("projectId")||"";
  const [runId, setRunId] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const response = await fetch(`/files/listFiles?id=${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      const data: string[] = await response.json();
      const a = data.filter((e) => !e.endsWith(".exe"));
      const b = a.sort((a, b) => {
        if (a == "parameters.json") return -1;
        if (b == "parameters.json") return 1;
        let extA = a.split(".").pop();
        let extB = b.split(".").pop();
        if (extA == extB) return a == b ? 0 : (a < b ? -1 : 1);
        if (extA == "js") return -1;
        if (extB == "js") return 1;
        if (extA == "cpp") return -1;
        if (extB == "cpp") return 1;
        return a == b ? 0 : (a < b ? -1 : 1);
      })
      setFiles(b)
      console.log(b)
    })();
  }, [])
  return (
    <MantineProvider>
      <Splitter style={{ height: "100%", width: "100%", flex: 1 }} ml="sm">
        <Splitter.Pane defaultSize={50}>
          <Tabs defaultValue={"params"}>
            <Tabs.List>
              <Tabs.Tab value="params" >
                Parameters
              </Tabs.Tab>
              <Button onClick={() => setRunId((prev) => prev + 1)}>
                Run
              </Button>
              {files.map((e, i) => (
                <Tabs.Tab value={e} key={e}>
                  {e}
                </Tabs.Tab>))
              }
            </Tabs.List>
            <Tabs.Panel value='params'>
              <ParamsTab projectId={projectId} />
            </Tabs.Panel>
            {files.map((e, i) => (
              <Tabs.Panel value={e} key={e}>
                <FileView projectId={projectId} fileName={e} />
              </Tabs.Panel>))
            }
          </Tabs>
        </Splitter.Pane>
        <Splitter.Pane defaultSize={50} bg="teal">
          <RunLog projectId={projectId} runId={runId} />
        </Splitter.Pane>
      </Splitter>
    </MantineProvider>
  )
}

export default App
