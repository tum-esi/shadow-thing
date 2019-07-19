import { readFile } from 'fs';
import * as cluster from 'cluster';

import * as winston from 'winston';

import * as WoT from "wot-typescript-definitions";
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";
import { CoapServer } from "@node-wot/binding-coap";

import { VirtualThing } from "./virtual-thing";

const NUM_CPUS = require('os').cpus().length;
const DEFAULT_CONFIG_PATH = "./server-config.json";

let config: ServerConfig;

interface IntervalConfig {
    [key:string]: number;
}

interface ThingConfig {
    instances: number;
    eventIntervals: IntervalConfig;
}

interface ThingsConfig {
    [key:string]: ThingConfig;
}

interface ServerConfig {
    mode: string;
    staticAddress: string;
    ports: number;
    protocol: string;
    things: ThingsConfig; 
}

/** Creates a logger for messages from other scripts  */ 
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


/** For specific logging from this script  */
const log = (msg: string) => {
    process.stdout.write("test_server >> " + msg + "\n");
}

const readFilePromise = (path: string) => {
    return new Promise( (resolve, reject) => {
        readFile(path, 'utf-8', (error, data) => {
            if(error) {
                reject(error);
            }
            resolve(data);
        });
    }).catch( err => log(err) );
}

const initServient = (num: number) => {
    Helpers.setStaticAddress(config.staticAddress);    
    let factoryList: Array<Promise<WoT.WoTFactory>> = [];
    for(let pos = 0; pos<num; pos++){
        let servient = new Servient();
        switch(config.protocol){
            case 'http':
                servient.addServer( new HttpServer({ port: 8080+pos }) );
                break;
            case 'coap':
                servient.addServer( new CoapServer(5683+pos) );
                break;
            case 'mqtt':
                break;
            default:
                log("Unknown protocol specified.");
                process.exit(0);
                break;
        }
        factoryList.push(servient.start());
    }
    return Promise.all(factoryList);
}

/** Initiate virtual-thing */
const initThing = async (tdPath: string, thingFactory: WoT.WoTFactory, insNum: number) => {
    await readFilePromise(tdPath).then( (td:WoT.ThingDescription) => {
        let jsonTd: WoT.ThingInstance = JSON.parse(td);
        new VirtualThing(
            {
                ...jsonTd,
                title: `${jsonTd.title}_${insNum}`,
                id: `${jsonTd.id}:n-${insNum}`
            },
            thingFactory,
            {
                eventIntervals: config.things[tdPath].eventIntervals
            }
        ).expose();
    });
}

const launchSingleThread = async () => {
    let thingPaths = Object.assign({}, config.things);
    
    initServient(config.ports).then( (factoryList: Array<WoT.WoTFactory>) => {
        let lastPos = 0;
        for(let path in thingPaths){
            while(thingPaths[path].instances){
                for(let i = lastPos; i<factoryList.length; i++){
                    initThing(path, factoryList[i], thingPaths[path].instances--);
                    log(''+thingPaths[path].instances);
                    
                    if(thingPaths[path].instances === 0){
                        lastPos = i;
                        break;
                    }
                }
            }
        }
    });

}
 
const launchMultiThread = () => {
    
}

createLogger('error');
readFilePromise(DEFAULT_CONFIG_PATH).then( (file: string) => {
    config = JSON.parse(file);
    if(cluster.isMaster){
        if(config.mode === 'single'){
            launchSingleThread();
        }else{
            for(let n = 0; n<NUM_CPUS; n++){
                cluster.fork({});
            }
        }
    }else{
        launchMultiThread();
    }
});
