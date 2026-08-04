import { useState } from 'react'
import './App.css'
import { Button, Flex, Group, Input, MantineProvider, RangeSlider, Splitter, Stack, Switch, Tabs, TextInput } from '@mantine/core'
import '@mantine/core/styles.css';
function App() {
  const [count, setCount] = useState(0)
  const [params, setParams] = useState<{ variable: string, range: [number, number] }[]>([{ variable: "N", range: [1, 100] }, { variable: "N", range: [1, 100] }]);
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
              <Stack>
                <TextInput label="cppFile" />
                <TextInput label="jsFile" />
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
                          console.log(pars)
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
                      </Group>
                    </div>
                  ))}
                  <Button onClick={() => {
                    console.log(params, params.concat({ range: [1, 10], variable: "HMM" }))
                    setParams(params.concat([{ range: [1, 10], variable: "HMM" }]))
                  }
                  }>Add params</Button>
                  <Switch label="verbose output?" name='verbose' />
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
