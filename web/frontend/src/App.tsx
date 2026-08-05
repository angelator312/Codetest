import { useState } from 'react'
import './App.css'
import { Button, Center, CloseButton, Flex, Group, Input, MantineProvider, RangeSlider, Space, Splitter, Stack, Switch, Tabs, TextInput } from '@mantine/core'
import '@mantine/core/styles.css';
import type { Params } from './types';
function App() {
  const [count, setCount] = useState(0)
  const [params, setParams] = useState<{ variable: string, range: [number, number] }[]>([{ variable: "N", range: [1, 100] }, { variable: "M", range: [1, 20] }]);
  const [verbose, setVerbose] = useState(false);
  const [cppFile, setCppFile] = useState("");
  const [jsFile, setJsFile] = useState("");
  const createJSON = () => {
    let json: Params = { flags: [], jsFile, cppFile, args: {} };
    for (const { variable, range } of params) {
      json.args[variable] = `${range[0]}..${range[1]}`;
    }
    if (verbose) json.flags = ["--verbose"];
    return json;
  }
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
              <Button>
                Run
              </Button>
            </Tabs.List>
            <Tabs.Panel value='params'>
              <Space h="sm" />
              <Stack>
                <Group grow>
                  CPP file:
                  <TextInput value={cppFile}
                    onChange={(event) => setCppFile(event.currentTarget.value)} />
                </Group>
                <Group grow>
                  JS file:
                  <TextInput value={jsFile}
                    onChange={(event) => setJsFile(event.currentTarget.value)} />
                </Group>
                <Stack>
                  {params.map((e, i) => (
                    <div
                      key={i}
                    >
                      <Group grow preventGrowOverflow={false}>

                        <TextInput style={{ flex: "0 0 10ch" }} value={e.variable} onChange={(ev) => {
                          let pars = [...params];
                          pars[i].variable = ev.currentTarget.value;
                          setParams(pars)
                        }} variant="filled" />
                        :
                        <RangeSlider
                          color="blue"
                          value={e.range}
                          max={500}
                          onChange={(range) => {
                            const pars = [...params]
                            pars[i].range = range
                            setParams(pars)
                          }}
                        />
                        <CloseButton style={{ flex: "0 0 2ch" }} onClick={() => setParams((e2) => { e2.splice(i, 1); return [...e2]; })} />
                      </Group>
                    </div>
                  ))}
                  <Center>
                    <Button onClick={() => {
                      setParams(params.concat([{ range: [1, 10], variable: "HMM" }]))
                    }
                    }>Add params</Button>
                  </Center>
                  <Switch label="verbose output?" name='verbose' checked={verbose}
                    onChange={(event) => setVerbose(event.currentTarget.checked)} />
                  <Center>
                    <Button onClick={() => console.log(createJSON())}>
                      Save
                    </Button>
                  </Center>
                </Stack>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Splitter.Pane>
        <Splitter.Pane defaultSize={50} bg="teal">
          <div>
            <h1>WIP</h1>
            <p>
              Nothing done <code>src/App.tsx</code> and save to test <code>HMR</code>
            </p>
          </div>
          <button
            type="button"
            className="counter"
            onClick={() => setCount((count) => count + 1)}
          >
            Count is {count}
          </button>
        </Splitter.Pane>
      </Splitter>
    </MantineProvider>
  )
}

export default App
