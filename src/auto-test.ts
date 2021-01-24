import * as fs from "fs";
import { join } from "path";
import { fork, execSync } from "child_process";

import * as WoT from "wot-typescript-definitions";

const TEST_CONFIG_PATH = "./config-files/test-config.json";

interface IntervalConfig {
    start: number;
    end: number;
    step?: number;
}

interface TestConfig {
    modes: Array<string>;
    protocols: Array<string>;
    memory_limit: number;
    ports: IntervalConfig;
    clients: IntervalConfig;
    testProperties: boolean;
    testActions: boolean;
    testEvents: boolean;
    prop: IntervalConfig;
    action: IntervalConfig;
    event: IntervalConfig;
    nData: number;
    tdPath: string;
    thingInstance: IntervalConfig;
}

const parseArgs = () => {
    let argv = process.argv.slice(2);
    argv.forEach( (arg: string) => {
        if(arg.match(/^-g$/i)){
            generateOnly = true;
        }
    });
}

const log = (msg: string) => {
    console.log(`auto-test >> ${msg}`);
}

const readFilePromise = (path: string) => {
    return new Promise( (resolve, reject) => {
        fs.readFile(path, 'utf-8', (error, data) => {
            if(error){
                reject(error);
            }
            resolve(data);
        });
    });
}

const generateTests = (config: TestConfig, thing: WoT.ThingDescription) => {
    let counter: number = 0;

    config.modes.forEach( (mode: string) => {
        config.protocols.forEach( (protocol: string) => {
            for(let port = config.ports.start; port <= config.ports.end; port++){
                for (let client = config.clients.start; client <= config.clients.end; client += config.clients.step){
                    for(let p = config.prop.start; p <= config.prop.end; p += config.prop.step){
                        for(let a = config.action.start; a <= config.action.end; a += config.action.step){
                            for(let e = config.event.start; e <= config.event.end; e += config.event.step){
                                for(let t = config.thingInstance.start; t <= config.thingInstance.end; t += config.thingInstance.step){
                                    let path = `./tests/config/${++counter}`;
                                    let portNum: number;

                                    switch(protocol){
                                        case 'http':
                                            portNum = 8080; 
                                            break;
                                        case 'coap':
                                            portNum = 5683;
                                            break;
                                        case 'mqtt':
                                            portNum = 1883;
                                            break;
                                        default:
                                            break;
                                    }

                                    let clientConfig = {
                                        staticAddress: '127.0.0.1',
                                        clients: [
                                            {
                                                instances: client,
                                                protocol,
                                                thingURL: `127.0.0.1:${portNum}/${thing.title}_1_1`,
                                                measures: config.nData,
                                                events_to_sub: [],
                                                actions_to_inv: {},
                                                prop_to_read: {}
                                            }
                                        ]
                                    };

                                    let serverConfig = {
                                        mode,
                                        staticAddress: '127.0.0.1',
                                        servients: [
                                            {
                                                instances: port,
                                                protocol,
                                                things: {
                                                    [config.tdPath]: {
                                                        instances: t,
                                                        eventIntervals: {
                                                            
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    };

                                    if (config.testProperties){
                                        for(let pr in thing.properties){
                                            clientConfig.clients[0].prop_to_read[pr] = p;
                                        }
                                    }

                                    if (config.testActions) {
                                        for(let ac in thing.actions){
                                            clientConfig.clients[0].actions_to_inv[ac] = a;
                                        }
                                    }
                                    
                                    if (config.testEvents) {
                                        clientConfig.clients[0].events_to_sub = Object.keys(thing.events);
                                    }
                                        
                                    for(let ev in thing.events){
                                        serverConfig.servients[0].things[config.tdPath].eventIntervals[ev] = e;
                                    }

                                    if(!fs.existsSync(path)){
                                        fs.mkdirSync(path, { recursive: true });
                                    }
                                    fs.writeFileSync(join(path, 'S'), JSON.stringify(serverConfig, null, 4));
                                    fs.writeFileSync(join(path, 'C'), JSON.stringify(clientConfig, null, 4));
                                }
                            }
                        }
                    }
                }
            }
        });
    });
    return counter;
}

const runTests = async (currentTest: number, numTests: number, memLim: number) => {
    log(`Test ${currentTest} started`);
    let servers = fork('./dist/server-pool.js', ['-c', `./tests/config/${currentTest}/S`], { stdio: 'inherit', execArgv: [`--max-old-space-size=${memLim}`] });
    servers.on('close', (code, signal) => {
        log(`Test ${currentTest} done`);
        if(currentTest === numTests){
            process.exit(0);
        }
        runTests(++currentTest, numTests, memLim);
    });
    await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    execSync(`node ./dist/client-pool.js -c ./tests/config/${currentTest}/C ./tests/results/${currentTest}`, { stdio: 'inherit' });
    servers.kill();
}

var generateOnly = false;
parseArgs();
readFilePromise(TEST_CONFIG_PATH).then( (config: string) => {
    let testConfig: TestConfig = JSON.parse(config);
    if (!fs.existsSync(`./tests`)) {
        fs.mkdirSync(`./tests`, { recursive: true });
    }
    fs.copyFileSync(TEST_CONFIG_PATH, `./tests/test-config.json`); // to know the config for all the tests
    readFilePromise(testConfig.tdPath).then( (td: WoT.ThingDescription) => {
        let numTests = generateTests(testConfig, td);
        log(`Number of tests to execute : ${numTests}`);
        if(generateOnly){
            return;
        }
        runTests(1, numTests, testConfig.memory_limit);
    });
});

