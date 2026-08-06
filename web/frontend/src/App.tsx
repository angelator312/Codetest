import { useState } from 'react'
import './App.css'
import { Button, MantineProvider, Splitter, Tabs } from '@mantine/core'
import '@mantine/core/styles.css';
import { RunLog } from './RunLog';
import { ParamsTab } from './ParamsTab';
function App() {
  const [runId, setRunId] = useState(0);
  return (
    <MantineProvider>
      <Splitter style={{ height: "100%", width: "100%", flex: 1 }} ml="sm">
        <Splitter.Pane defaultSize={50}>
          <Tabs defaultValue={"params"}>
            <Tabs.List>
              <Tabs.Tab value="cpp_files" >
                Cpp Files
              </Tabs.Tab>
              <Tabs.Tab value="js_files" >
                JS Files
              </Tabs.Tab>
              <Tabs.Tab value="params" >
                Parameters
              </Tabs.Tab>
              <Button onClick={() => setRunId((prev) => prev + 1)}>
                Run
              </Button>
            </Tabs.List>
            <Tabs.Panel value='params'>
              <ParamsTab projectId='556'/>
            </Tabs.Panel>
          </Tabs>
        </Splitter.Pane>
        <Splitter.Pane defaultSize={50} bg="teal">
          <RunLog projectId="556" runId={runId} />
        </Splitter.Pane>
      </Splitter>
    </MantineProvider>
  )
}

export default App
