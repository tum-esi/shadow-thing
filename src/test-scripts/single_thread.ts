import { readFile } from "fs";

import * as WoT from "wot-typescript-definitions";
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";
import { CoapServer } from "@node-wot/binding-coap";
//import { MqttBrokerServer, MqttClientFactory } from "@node-wot/binding-mqtt";

import * as winston from "winston";

import { VirtualThing, VirtualThingConfig } from "../virtual-thing";

//const net = require('net');

var ports: number; // number of ports to distribute instances
var interval: number; // interval between two event emissions
var nInstance: number; // total number of instances to initiate
var protocol: string; // protocol used for test
var tdPath: string; // path to TD file 

const parseArgs = async () => {
    return new Promise( (resolve, reject) => {
        try{
            let argv = process.argv.slice(2);
            tdPath = argv.pop();
            protocol = argv.pop();
            [ports, interval, nInstance] = argv.map( arg => parseInt(arg) );
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

const initialiseThings = (td: WoT.ThingInstance, nPort: number) => {
    let servient = new Servient();
    
    Helpers.setStaticAddress("127.0.0.1");

    if( protocol === "http" ) {
        servient.addServer(new HttpServer({ port: 8080 + nPort }));
    }else if( protocol === "coap"){
        servient.addServer(new CoapServer(5683 + nPort));
    }else{
        //TODO: MQTT
    }
    
    let thingConfig: VirtualThingConfig = {
        eventIntervals: {}
    };

    for(let event in td.events){
        Object.assign(thingConfig.eventIntervals, { [event]: interval });
    }

    servient.start()
    .then((thingFactory: WoT.WoTFactory) => {
        for( let n = 0; n < nInstance/ports; n++ ) {
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

parseArgs()
.then( () => {
    return new Promise((resolve, reject) => {
        readFile(tdPath, "utf-8", (error, data) => {
            if(error){
                reject(new Error("Unable to read TD file."));
            } else {
                resolve(JSON.parse(data));
            }
        });
    })
}).then((td: WoT.ThingInstance) => {
    createLogger("error");
    for(let i = 0; i<ports; i++){
        initialiseThings(td, i);
    }
}).catch( err => console.error(err) );
