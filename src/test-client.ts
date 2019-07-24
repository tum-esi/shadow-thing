import { readFile } from "fs";

import * as WoT from "wot-typescript-definitions";
import { Servient, Helpers } from "@node-wot/core";
import { HttpClientFactory } from "@node-wot/binding-http";
import { CoapClientFactory } from "@node-wot/binding-coap";

const DEFAULT_CONFIG_PATH = "./client-config.json";

interface TestConfig{
    [key:string]: number;
}

interface ClientConfig {
    instances: number;
    thingURL: string;
    events_to_sub: Array<string>;
    actions_to_inv: TestConfig;
    prop_to_read: TestConfig;
}

interface Config {
    staticAddress: string;
    clients: Array<ClientConfig>;
}

const log = (msg: string) => {
    process.stdout.write(`test-client >> ${msg}\n`); 
}

const readFilePromise = (path: string) => {
    return new Promise( (resolve, reject) => {
        readFile(DEFAULT_CONFIG_PATH, 'utf-8', (error, data) => {
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
            }).catch((err: Error => log("Error, retrying..."));
        }
    });
}

const initClient = (config: Config) => {
    
}

