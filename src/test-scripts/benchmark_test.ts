import { readFile } from "fs";
import * as cluster from "cluster";

import * as winston from "winston";

import * as WoT from "wot-typescript-definitions";
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer, HttpClientFactory } from "@node-wot/binding-http";
import { CoapServer, CoapClientFactory } from "@node-wot/binding-coap";

import { VirtualThing, VirtualThingConfig } from "../virtual-thing";

const numCPUs = require('os').cpus().length;
const STATIC_ADDRESS = '127.0.0.1';

var totalPorts: number; // total number of ports to use
var evInterval: number; // event emission interval
var insPerPort: number; // instances per port used
var nbMeasures: number; // number of measures to take

var protocol: string; // protocol used for IO
var tdPath: string; // path to TD file used to create virtual-thing

var mode: string; // single or multiple threads

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

const parseArgs = async () => {
    return new Promise( (resolve, reject) => {
        try{
            let argv = process.argv.slice(2);
            tdPath = argv.pop();
            protocol = argv.pop();
            mode = argv.pop();

            [totalPorts, evInterval, insPerPort, nbMeasures] = argv.map( (arg) => parseInt(arg) );
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

const writeResultFile = (data: Array<object>) => {
    let csvWriter = require('csv-writer').createObjectCsvWriter({
        path: `test_results/${mode}-thread/${protocol}/${totalPorts}-${evInterval}-${insPerPort*totalPorts}`,
        header: [
            {id: 'interval', title: 'Interval'},
            {id: 'startTime', title: 'Start'},
            {id: 'endTime', title: 'End'}
        ]
    });

    return csvWriter.writeRecords(data);
}

const initialiseThingsSingleThread = (td: WoT.ThingInstance) => {
    Helpers.setStaticAddress(STATIC_ADDRESS);

    for(let i = 0; i<totalPorts; i++){
        let servient = new Servient();
        
        if( protocol === 'http' ){
            servient.addServer( new HttpServer({ port: 8080 + i }) );
        }else if ( protocol === 'coap' ){
            servient.addServer( new CoapServer(5683 + i) );
        }else if ( protocol === 'mqtt' ){

        }

        let thingConfig: VirtualThingConfig = {
            eventIntervals: {}
        };

        for(let event in td.events){
            Object.assign(thingConfig.eventIntervals, { [event]: evInterval });
        }

        servient.start()
        .then((thingFactory: WoT.WoTFactory) => {
            for( let n = 0; n<insPerPort; n++ ){
                new VirtualThing(
                    {
                        ...td,
                        title: td.title + (n+1),
                        id: td.id + ':n-' + (n+1)
                    },
                    thingFactory,
                    thingConfig
                ).expose();
            }
        }).catch( err => console.error(err) );
    }
}

const initialiseThingsMultiThread = (td: WoT.ThingInstance) => {
    Helpers.setStaticAddress(STATIC_ADDRESS);

    if(cluster.isMaster) {
        for(let i = 0; i<numCPUs || i<totalPorts; i++){
            cluster.fork({num: i});
        }
    }else{
        let servient = new Servient();
        if ( protocol === 'http' ){
            servient.addServer( new HttpServer({ port: 8080 + parseInt(process.env.num) }) );
        }else if( protocol === 'coap' ){
            servient.addServer( new CoapServer(5683 + parseInt(process.env.num)) );
        }else if( protocol === 'mqtt' ){

        }

        let thingConfig: VirtualThingConfig = {
            eventIntervals: {}
        }

        for(let event in td.events){
            Object.assign(thingConfig.eventIntervals, { [event]: evInterval });
        }

        servient.start()
        .then((thingFactory: WoT.WoTFactory) => {
            for( let n = 0; n<insPerPort; n++ ){
                new VirtualThing(
                    {
                        ...td,
                        title: td.title + (n+1),
                        id: td.id + ':n-' + (n+1)
                    },
                    thingFactory,
                    thingConfig
                ).expose();
            }
        }).catch( err => console.error(err) );
    }
}

const startTestEvent = (td: WoT.ThingInstance) => {
    let servient = new Servient();
    let port: number;
    let data: Array<object> = [];
    var counter: number = 0;

    if( protocol === 'http' ){
        port = 8080;
        servient.addClientFactory( new HttpClientFactory() );
    }else if ( protocol === 'coap' ){
        port = 5683;
        servient.addClientFactory( new CoapClientFactory() );
    }else if ( protocol === 'mqtt' ){
    
    }

    servient.start()
    .then((thingFactory: WoT.WoTFactory) => {
        return thingFactory.fetch(`${protocol}://${STATIC_ADDRESS}:${port}/${td.title}1`)
            .then((fetchedTD: WoT.ThingDescription) => {
                return thingFactory.consume(fetchedTD);  
            });
    }).then((thing: WoT.ConsumedThing) => {
        var startTime = new Date();

        thing.events[Object.keys(thing.events)[0]].subscribe(
            () => {
                let endTime = new Date();
                data.push({
                    interval: endTime.getTime() - startTime.getTime(),
                    startTime,
                    endTime
                });
                startTime = new Date();
                if( ++counter >= nbMeasures){
                    writeResultFile(data).then( () => {
                        for(var id in cluster.workers){
                            cluster.workers[id].kill();
                        }
                        process.exit(0);
                    });
                }
                console.error(counter);
            },
            (err: Error) => console.error(err),
            () => console.error('End of test.')
        );
    });
}

parseArgs().then(() => {
    createLogger('error');
    readFile(tdPath, 'utf-8', (error, data) => {
        if(error){
            throw error;
        }
        let td = JSON.parse(data);
        if( mode === 'single' ){
            initialiseThingsSingleThread(td);
        }else if( mode === 'multi' ){
            initialiseThingsMultiThread(td);
        }
        if(cluster.isMaster) {
            setTimeout(() => startTestEvent(td), 60000);
        }
    });
}).catch( (err: Error) => console.error(err) );
