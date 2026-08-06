import { useEffect, useState } from "react";
import type { Params } from "./types";
import { Button, Center, CloseButton, Group, RangeSlider, Space, Stack, Switch, TextInput } from "@mantine/core";

export function ParamsTab({ projectId }: { projectId: string }) {
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
    useEffect(() => {
        const a = async () => {
            const response = await fetch('/files/loadParameters?id=556', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data: Params = await response.json();
            setCppFile(data.cppFile);
            setJsFile(data.jsFile);
            if (data.flags.indexOf("--verbose") != -1) setVerbose(true);
            setParams(Object.entries(data.args).map(([a, b]) => {
                const bb = b.split("..");

                return { variable: a, range: [parseInt(bb[0], 10), parseInt(bb.length > 1 ? bb[1] : bb[0], 10)] }
            }));
            console.log(data)
        };
        a();
    }, []);
    return (
        <>
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
        </>
    )
}