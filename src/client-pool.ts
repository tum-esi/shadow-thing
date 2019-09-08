import * as fs from "fs";
import { join } from "path";

import * as winston from 'winston';

import * as WoT from "wot-typescript-definitions";
import { Servient } from "@node-wot/core";
import { HttpClientFactory } from "@node-wot/binding-http";
import { CoapClientFactory } from "@node-wot/binding-coap";
import { MqttClientFactory } from "@node-wot/binding-mqtt";

const jsf = require("json-schema-faker");

const DEFAULT_CONFIG_PATH = "./config-files/client-config.json";

let config: Config;

interface TestConfig{
    [key:string]: number;
}

interface ClientConfig {
    instances: number;
    protocol: string;
    thingURL: string;
    measures: number;
    events_to_sub: Array<string>;
    actions_to_inv: TestConfig;
    prop_to_read: TestConfig;
}

interface Config {
    clients: Array<ClientConfig>;
}

const parseArgs = () => {
    let argv = process.argv.slice(2);
    let configFlag = false;

    argv.forEach( (arg: string) => {
        if(configFlag){
            configFlag = false;
            configPath = arg;
        }else if(arg.match(/^-c|--config$/i)){
            configFlag = true;
        }else{
            resultPath = arg;
        }
    });

    if(!resultPath){
        log("Please specify path for result output.");
        process.exit(0);
    }
}

const createLogger = (logLevel: string) => {
    let logger = winston.createLogger({
        level: logLevel,
        format: winston.format.cli(),
        transports: [new winston.transports.Console()]
    });

    console.debug = (msg:string) => logger.debug(msg);
    console.log = (msg:string) => logger.verbose(msg);
    console.info = (msg:string) => logger.info(msg);
    console.warn = (msg:string) => logger.warn(msg);
    console.error = (msg:string) => logger.error(msg);
}

const log = (msg: string) => {
    process.stdout.write(`test-client >> ${msg}\n`); 
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

const fetchAndConsume = (factory: WoT.WoTFactory, url: string) => {
    return new Promise(async (resolve,reject) => {
        let resolved = false;
        while(!resolved){
            log("Fetching...");
            await factory.fetch(url).then((fetchedTD: WoT.ThingDescription) => {
                resolve(factory.consume(fetchedTD));
                resolved = true;
            }).catch(async (err: Error) => {
                log("Error, retrying in 5 seconds...");
                await new Promise(resolve => setTimeout(() => resolve(), 5000));
            });
        }
    });
}

const testProp = (thing: WoT.ConsumedThing, prop: string, delay: number, nbMeasures: number) => {
    return new Promise( (resolve, reject) => {
        let data: Array<object> = [];
        log(`Started test for read of <${prop}> every ${delay} seconds.`);
        let interval = setInterval( async () => {
            let startTime = new Date();
            await thing.properties[prop].read();
            let endTime = new Date();
            data.push({
                interval: endTime.getTime() - startTime.getTime(),
                startTimeFormatted:startTime,
                endTimeFormatted:endTime,
                startTimeMS: startTime.getTime(),
                endTimeMS: endTime.getTime()
            });

            if(data.length >= nbMeasures){
                clearInterval(interval);
                resolve(data);
            }
        }, delay*1000);
    });
}

const testAction = (thing: WoT.ConsumedThing, action: string, delay: number, nbMeasures: number) => {
    return new Promise( (resolve, reject) => {
        let data: Array<object> = [];
        log(`Started test for invoke of <${action}> every ${delay} seconds.`);
        let interval = setInterval( async () => {
            let startTime = new Date();
            if(thing.actions[action].input){
                await thing.actions[action].invoke(jsf(thing.actions[action].input));
            }else{
                await thing.actions[action].invoke();
            }
            let endTime = new Date();
            data.push({
                interval: endTime.getTime() - startTime.getTime(),
                startTimeFormatted: startTime,
                endTimeFormatted: endTime,
                startTimeMS: startTime.getTime(),
                endTimeMS: endTime.getTime()
            });

            if(data.length >= nbMeasures){
                clearInterval(interval);
                resolve(data);
            }
        }, delay*1000);
    });
}

const testEvent = (thing: WoT.ConsumedThing, event: string, nbMeasures: number) => {
    return new Promise( (resolve, reject) => {
        let startTime = new Date();
        let data: Array<object> = [];
        log(`Started test for subscription of <${event}> for ${nbMeasures} emissions.`);
        let subscription = thing.events[event].subscribe(
            () => {
                let endTime = new Date();
                data.push({
                    interval: endTime.getTime() - startTime.getTime(),
                    startTimeFormatted: startTime,
                    endTimeFormatted: endTime,
                    startTimeMS: startTime.getTime(),
                    endTimeMS: endTime.getTime()
                });
                startTime = new Date();

                if(data.length >= nbMeasures){
                    subscription.unsubscribe();
                    resolve(data);
                }
            },
            (err: Error) => console.error(err)
        );
    });
}

const startTest = (clientConfig: ClientConfig) => {
    let servient = new Servient();

    if(clientConfig.protocol === "http"){
        servient.addClientFactory(new HttpClientFactory());
    }else if(clientConfig.protocol === "coap"){
        servient.addClientFactory(new CoapClientFactory());
    }else if(clientConfig.protocol === "mqtt"){
        servient.addClientFactory(new MqttClientFactory());
    }

    return servient.start()
    .then( (thingFactory: WoT.WoTFactory) => {
        return fetchAndConsume(thingFactory, `${clientConfig.protocol}://${clientConfig.thingURL}`);
    }).then( (thing: WoT.ConsumedThing) => {
        let propPromises = [];
        let actionPromises = [];
        let eventPromises = [];

        for(let prop in clientConfig.prop_to_read){
            propPromises.push(testProp(thing, prop, clientConfig.prop_to_read[prop], clientConfig.measures));
        }

        for(let action in clientConfig.actions_to_inv){
            actionPromises.push(testAction(thing, action, clientConfig.actions_to_inv[action], clientConfig.measures));
        }
        
        clientConfig.events_to_sub.forEach( (event: string) => {
            eventPromises.push(testEvent(thing, event, clientConfig.measures));
        });

        return ({
            props: Promise.all(propPromises), 
            actions: Promise.all(actionPromises), 
            events: Promise.all(eventPromises)
        });
    })
}

const writeResultFile = (data: Array<object>, pathName: string, fileName: string) => {
    if(!fs.existsSync(pathName)){
        fs.mkdirSync(pathName, { recursive: true });
    }

    let path = join(pathName, fileName);
    let csvWriter = require('csv-writer').createObjectCsvWriter({
        path,
        header: [
            {id: 'interval', title: 'Interval in ms'},
            {id: 'startTimeFormatted', title: 'Start Time in Readable Format'},
            { id: 'endTimeFormatted', title: 'End Time in Readable Format'},
            { id: 'startTimeMS', title: 'Start Time in ms' },
            { id: 'endTimeMS', title: 'End Time in ms' }
        ]
    });

    return csvWriter.writeRecords(data);
}


var configPath: string = DEFAULT_CONFIG_PATH;
var resultPath: string;
var tasks = [];

parseArgs();
createLogger('info');
readFilePromise(configPath).then( (file: string) => {
    config = JSON.parse(file);
    config.clients.forEach( (client: ClientConfig, index: number) => {
        for(let i = 1; i <= client.instances; i++){
            startTest(client).then((results) => {
                tasks.push(new Promise((resolve, reject) => {
                    results.props.then( async (args) => {
                        let nProp= 0;
                        for(let arg of args){
                            await writeResultFile(arg, join(resultPath, `#${index + 1}/instance_${i}`), `prop_${Object.keys(client.prop_to_read)[nProp++]}.csv`);
                        }
                        resolve();
                    });
                }));

                tasks.push(new Promise((resolve, reject) => {
                    results.actions.then( async (args) => {
                        let nAction= 0;
                        for(let arg of args){
                            await writeResultFile(arg, join(resultPath, `#${index+1}/instance_${i}`),`action_${Object.keys(client.actions_to_inv)[nAction++]}.csv`);
                        }
                        resolve();
                    });
                }));

                tasks.push(new Promise((resolve, reject) => {
                    results.events.then( async (args) => {
                        let nEvent= 0;
                        for(let arg of args){
                            await writeResultFile(arg, join(resultPath, `#${index + 1}/instance_${i}`), `event_${client.events_to_sub[nEvent++]}.csv`);
                        }
                        resolve();
                    });
                }));

                Promise.all(tasks).then( () => {
                    log("Closing clients.");
                    process.exit(0); 
                });
            });
        }
    });
});

