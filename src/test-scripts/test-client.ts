import { readFile } from "fs";

import * as winston from "winston";

import * as WoT from "wot-typescript-definitions";
import { Servient } from "@node-wot/core";
import { HttpClientFactory } from "@node-wot/binding-http";
import { CoapClientFactory } from "@node-wot/binding-coap";

var port: number;

var scheme: string;
var tdPath: string;
var nbMeasures: number; // measures to take

// Test variables for csv result file naming
var totalPorts: number;
var totalInstances: number;
var realInterval: number;

var counter: number = 0;

var servient = new Servient();

const parseArgs = async () => {
    return new Promise( (resolve, reject) => {
        try{
            let argv = process.argv.slice(2);
            
            realInterval = parseInt(argv.pop());
            totalInstances = parseInt(argv.pop());
            totalPorts = parseInt(argv.pop());

            nbMeasures = parseInt(argv.pop());

            [scheme, tdPath] = argv;
            
            if( scheme === 'http' ){
                port = 8080;
                servient.addClientFactory(new HttpClientFactory());
            }else if( scheme === 'coap' ){
                port = 5683;
                servient.addClientFactory(new CoapClientFactory());
            }else if( scheme === 'mqtt' ){
                port = 1883;
            }else{
                reject(new Error("Unknown protocol."));
            }
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

const initializeCsvWriter = () => {
    return require('csv-writer').createObjectCsvWriter({
        path: `test_results/${scheme}/${realInterval}-${totalPorts}-${totalInstances}`,
        header: [
            {id: 'interval', title: 'Interval'},
            {id: 'startTime', title: 'Start'},
            {id: 'endTime', title: 'End'}
        ]
    });

}

const createLogger = (logLevel: string) => {
    let logger = winston.createLogger({
        level: logLevel,
        format: winston.format.cli(),
        transports: [new winston.transports.Console()]
    });

    console.debug = (msg: string) => logger.debug(msg);
    console.log = (msg: string) => logger.verbose(msg);
    console.info = (msg: string) => logger.info(msg);
    console.warn = (msg: string) => logger.warn(msg);
    console.error = (msg: string) => logger.error(msg);
}


var data: Array<object> = [];

createLogger('info');
parseArgs().then( () => {
    return servient.start();
}).then( (factory: WoT.WoTFactory) => {
    return new Promise( (resolve, reject) => {
        readFile(tdPath, 'utf-8', (error, data) => {
            if (error) {
                reject(error);
            }else{
                resolve(JSON.parse(data));
            }
        });
    }).then( (td: WoT.ThingInstance) => {
        return factory.fetch(`${scheme}://localhost:${port}/${td.title}1`);
    }).then( (fetchedTD: WoT.ThingDescription) => {
        return factory.consume(fetchedTD);
    })
}).then( (thing: WoT.ConsumedThing) => {
    var startTime = new Date();

    thing.events[Object.keys(thing.events)[0]].subscribe( 
        () => {
            let endTime = new Date();
            data.push({
                interval: endTime.getTime() - startTime.getTime(),
                startTime,
                endTime
            });
            startTime = endTime;
            console.info(counter);
            if(++counter >= nbMeasures){
                initializeCsvWriter().writeRecords(data).then( () => process.exit(0) );
            }
        },
        (err: Error) => console.error(err),
        () => console.error("End of test.") 
    );
}).catch( (err: Error) => console.error(err) );
