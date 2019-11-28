import { readFile } from 'fs';
import * as cluster from 'cluster';

import * as winston from 'winston';

import * as WoT from "wot-typescript-definitions";
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";
import { CoapServer } from "@node-wot/binding-coap";

import { VirtualThing } from "./virtual-thing";

const NUM_CPUS = require('os').cpus().length;
const DEFAULT_CONFIG_PATH = "./config-files/server-config.json";

let config: Config;

/** Interfaces for typescript type check */
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
    instances: number;
    protocol: string;
    things: ThingsConfig;
}

interface Config {
    mode: string;
    staticAddress: string;
    servients: Array<ServerConfig>;
}

/** Parses inputs transmitted from script run (Terminal)  */
const parseArgs = () => {
    let argv = process.argv.slice(2);
    let configFlag = false;

    argv.forEach( (arg: string) => {
        if(configFlag){
            configFlag = false;
            configPath = arg;
        }else if(arg.match(/^-c|--config$/i)){
            configFlag = true;
        }
    });
}

/** Creates a logger for messages from other scripts  
 *  @param logLevel - A string representing the level of output to print in console
 */  
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

/** For specific logging from this script 
 *  @param msg - A string representing the message to print.
 */
const log = (msg: string) => {
    process.stdout.write("test-server >> " + msg + "\n");
}

/** File read which returns a promise 
 *  @param path - A string representing path where the file is located
 */
const readFilePromise = (path: string) => {
    return new Promise( (resolve, reject) => {
        readFile(path, 'utf-8', (error, data) => {
            if(error) {
                reject(error);
            }
            resolve(data);
        });
    })
}

/** Initialises a servient and the things hosted on it after 
 *  @param servConfig - A ServerConfig which contains various variables for the configuration of servients
 *  @param servNum - A number which acts as a unique identifier of the servient
 *  @param portPos - A number which indicates the offset from the default port for a protocol
 */
const initServer = (servConfig: ServerConfig, servNum: number, portPos: number) => {
    Helpers.setStaticAddress(config.staticAddress);
        
    let servient = new Servient();
    switch(servConfig.protocol){
        case 'http':
            servient.addServer( new HttpServer({ port: 8080+ portPos}) );
            break;
        case 'coap':
            servient.addServer( new CoapServer(5683 + portPos) );
            break;
        case 'mqtt':
            //TODO?
            break;
        default:
            console.error("Unknown protocol specified.");
            process.exit(0);
            break;
    }

    servient.start().then( (factory: WoT.WoTFactory) => {
        log("servient started " + servNum + "at port diff" + portPos)
        for(let thingPath in servConfig.things){
            initThings(thingPath, factory, servNum, servConfig.things[thingPath]);
        }
    });
}

/** Initiate virtual-thing 
 *  @param tdPath - A string indicating the path of the json file which contains the ThingDescription
 *  @param thingFactory - A WoTFactory attached to the servient which is used to spawn things
 *  @param servNum - A number indicating the unique identifier of a servient
 *  @param thingConf - A configuration object for creating the thing
 */
const initThings = async (tdPath: string, thingFactory: WoT.WoTFactory, servNum: number, thingConf: ThingConfig) => {
    await readFilePromise(tdPath).then( (td:WoT.ThingDescription) => {
        let jsonTd: WoT.ThingInstance = JSON.parse(td);
        for(let i = 1; i<=thingConf.instances; i++){
            new VirtualThing(
                {
                    ...jsonTd,
                    title: `${jsonTd.title}_${servNum}_${i}`,
                    id: `${jsonTd.id}:${servNum}-${i}`
                },
                thingFactory,
                {
                    eventIntervals: thingConf.eventIntervals
                }
            ).expose()
            var endTime = new Date();
            log(String(endTime.getTime() - startTime.getTime()));
            log("exposed instance " + i + " " + servNum*i);
        }
    });
}

/** Runs when 'single' mode is specified */
const launchSingleThread = () => {
    let counter = {
        serv_num: 0,
        http: 0,
        coap: 0,
        mqtt: 0
    };
    
    log("Launching servients in single thread...");
    
    config.servients.forEach( (servConfig) => {
        for(let i = 0; i<servConfig.instances; i++){
            initServer(servConfig, ++counter.serv_num,  counter[servConfig.protocol]++);
        }
    });
}

/** Executed by worker processes to initialise a servient on an individual thread */
const launchMultiThread = () => {
    initServer(config.servients[parseInt(process.env.servNum)], cluster.worker.id, parseInt(process.env.portPos));
}

/** Main logic of script */
var startTime = new Date();

var configPath = DEFAULT_CONFIG_PATH;
parseArgs();
createLogger('error');
readFilePromise(configPath).then( (file: string) => {
    config = JSON.parse(file);
    if(cluster.isMaster){
        if(config.mode === "multi"){
            process.on('SIGTERM', async () => {
                for(let id in cluster.workers){
                    log(`Killing worker ${id}.`);
                    cluster.workers[id].kill();
                }
                cluster.disconnect( () => {
                    log("Servers exited.");
                    process.exit(0);
                });
            });
        }else{
            process.on('SIGTERM', () => {
                log("Servers exited.");
                process.exit(0);
            });
        }

        if(config.mode === 'single'){
            launchSingleThread();
        }else if(config.mode === 'multi'){
            log("Launching servients in multiple threads...");
            let servCount = 0;
            let counter = {
                serv_num: 0,
                http: 0,
                coap: 0,
                mqtt: 0
            }
            
            config.servients.forEach((servient: ServerConfig) => {
                servCount += servient.instances;
            });

            if( servCount > NUM_CPUS ) {
                log("Number of servients exceeds number of cores. Shutting down..");
                process.exit(0);
            }
            config.servients.forEach((servient: ServerConfig) => {
                for(let i = 0; i<servient.instances; i++){
                    cluster.fork({
                        portPos: counter[servient.protocol]++,
                        servNum: counter.serv_num
                    });
                }
                counter.serv_num++;
            });
        }else{
            console.error("Mode not recognized.")
        }
    }else{ // Executed only by worker processes
        log(`Worker ${cluster.worker.id} started.`);
        launchMultiThread();
    }
}).catch((err: Error) => console.error(err));
