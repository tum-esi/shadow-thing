#!/usr/bin/env node
import { readFile , readFileSync } from "fs";
import { join } from "path";

import * as WoT from "wot-typescript-definitions";
import { Servient, Helpers } from "@node-wot/core";
import { HttpConfig, HttpServer, HttpClientFactory, HttpsClientFactory } from "@node-wot/binding-http";
import { WebSocketServer } from "@node-wot/binding-websockets";
import { CoapServer, CoapClientFactory, CoapsClientFactory } from "@node-wot/binding-coap";
import { MqttBrokerServer, MqttClientFactory} from "@node-wot/binding-mqtt";

import * as winston from "winston";

import { defaultQuery, configurationQuery }  from "./user-query";
import { VirtualThing } from "./virtual-thing";
import { DigitalTwin } from "./digital-twin";

const Ajv = require('ajv');
const net = require('net');

// Initialize Ajv and add JSON schema for configuration file validation
var ajv = new Ajv();
var schemaLocation = join(__dirname, '..', 'validation-schemas' ,'config-json-schema-validation.json');
var schema = readFileSync(schemaLocation);
ajv.addSchema(schema, "config");

// Default values for configuration
const DEFAULT_LOG_LEVEL = 2;
const DEFAULT_STATIC_ADDRESS = "127.0.0.1";
const DEFAULT_EVENT_INTERVAL = 15;
const DEFAULT_TWIN_CACHING = 10;

const DEFAULT_HTTP_PORT = 8080;
const DEFAULT_COAP_PORT = 5683;

const DEFAULT_MQTT_CONFIG = {
    local: {
        port: 1883
    }
};

const EXAMPLE_TD_PATH = join(__dirname, "..", "examples", "td", "coffee_machine_td.json");

interface CoapConfig{
    port?: number;
    address?: string;
}

interface MqttConfig{
    local?: MqttLocalConfig;
    online?: MqttOnlineConfig;
}

interface MqttOnlineConfig{
    uri?: string;
    username?: string;
    password?: string;
    clientId?: string;
}

interface MqttLocalConfig{
    port: number;
}

interface ServientConfig{
    staticAddress: string;

    http?: HttpConfig;

    coap?: CoapConfig;

    mqtt?: MqttConfig;
}

interface LogConfig{
    level: number;
}

interface IntervalsConfig{
    [key: string]: number;
}

interface VirtualThingConfig{
    nInstance: number;
    
    eventIntervals: IntervalsConfig;

    twinPropertyCaching: IntervalsConfig;

    credentials?: Object;
}

interface ThingConfigList{
    [key: string]: VirtualThingConfig;
}

interface ConfigFile{
    servient: ServientConfig;

    log: LogConfig;

    things: ThingConfigList;
}

const parseArgs = (modPaths: Array<string>, twinPaths: Array<string>, tDescPaths: Array<string>) => {
    let argv = process.argv.slice(2);
    let configPresentFlag = false;
    digitalTwinFlag = false;
        
    argv.forEach( (arg: string) => {
        if (configPresentFlag) {
            configPresentFlag = false;
            configPath = arg;

        } else if (digitalTwinFlag) {
            digitalTwinFlag = false;
            modPaths.push(arg.split("::")[1]);
            twinPaths.push(arg.split("::")[0]);

        } else if (arg.match(/^(-t|--twin)$/i)) {
            digitalTwinFlag = true;

        } else if (arg.match(/^(-c|--configfile)$/i)) {
            configPresentFlag = true;

        } else if (arg.match(/^(-h|--help)$/i)) {
            printHelp();
            process.exit(0);

        } else if (arg.match(/^(-v|--version)$/i)) {
            console.info(require("../package.json").version);
    
        } else {
            tDescPaths.push(arg);
        }
    });
}

const confirmConfiguration = async (confPath: string, tdPaths: Array<string>, twinPaths: Array<string>, digitalTwinFlag:boolean) => {
    return new Promise( (resolve, reject) => {
        if(confPath){
            readConfigFile(confPath).then( (conf: string) => {
                if(!ajv.validate("config", conf)){
                    reject(new Error("Invalid configuration file format!"));
                    return;
                }
                console.log("Using configuration file located in : " + confPath);
                resolve(JSON.parse(conf));
            });
        }else{
            if(tdPaths.concat(twinPaths).length === 0){
                console.log("No TD specified, using example TD...");
                tdPaths.push(EXAMPLE_TD_PATH);
            }
            generateDefaultConfig(tdPaths, twinPaths).then( (defConf) => {
                console.log("Configuration file not specified. Default configuration file generated : ");
                console.log(JSON.stringify(defConf, null, 4));
                defaultQuery().then( (response: string) => {
                    if(response === "yes"){
                        resolve(defConf);
                    }else{
                        Promise.all(readTdFiles(tdPaths.concat(twinPaths))).then( (args) => resolve(configurationQuery(args.map( (arg) => JSON.parse(arg) ), digitalTwinFlag)) );
                    }
                });
            });
        }
    });    
}

/** Generates a default configuration when no configuration file is specified  **/
const generateDefaultConfig = async (tdPaths: Array<string>, twinPaths: Array<string>) => {
        
    let protocols = new Set();
        
    // Default skeleton of config object
    let config: ConfigFile = {
        servient: {
            staticAddress: DEFAULT_STATIC_ADDRESS
        },
        log: {
            level: DEFAULT_LOG_LEVEL
        },
        things: {}
    };

    // Default configuration for each Thing Description
    return Promise.all(readTdFiles(tdPaths.concat(twinPaths)))
        .then((args: Array<string>) => {
        
        // Configuration for each Thing
        args.forEach( (tdString: string) => {
            let td: WoT.ThingDescription = JSON.parse(tdString);

            let eventIntervals: IntervalsConfig = {};
            let twinPropertyCaching: IntervalsConfig = {};
    
            // Configuration for events and protocol detection
            for(let event in td.events){
                eventIntervals[event] = DEFAULT_EVENT_INTERVAL;
                td.events[event].forms.forEach( (form) => {
                    let protocol = form.href.substr(0, form.href.indexOf(':'));
                    protocols.add(protocol);
                });
            }
            
            // Configuration for properties and protocol detection
            for(let prop in td.properties){
                twinPropertyCaching[prop] = DEFAULT_TWIN_CACHING;
                td.properties[prop].forms.forEach( (form) => {
                    let protocol = form.href.substr(0, form.href.indexOf(':'));
                    protocols.add(protocol);
                });
            }
            
            // Protocol detection for actions
            for(let action in td.actions){
                td.actions[action].forms.forEach( (form) => {
                    let protocol = form.href.substr(0, form.href.indexOf(':'));
                    protocols.add(protocol);
                });
            }
            
            // Protocol detection if base is specified
            if(td.base){
                let protocol = td.base.substr(0, td.base.indexOf(':'));
                protocols.add(protocol);
            }

            config.things[td.id] = {
                nInstance: 1,
                eventIntervals,
                twinPropertyCaching
            }

        });
        
        // Configuration for detected protocols
        if(protocols.has("http")){
            let httpConfig: HttpConfig = {
                port: DEFAULT_HTTP_PORT
            }
            config.servient.http = httpConfig;
        }
        
        if(protocols.has("coap")){        
            let coapConfig: CoapConfig = {
                port: DEFAULT_COAP_PORT
            }
            config.servient.coap = coapConfig;
        }

        if(protocols.has("mqtt")){
            config.servient.mqtt = DEFAULT_MQTT_CONFIG;
        }

        return config;
    });
}

const readTdFiles = (tdPaths: Array<string>) => {
    let tdReadPromises: Array<Promise<string>> = [];
    tdPaths.forEach((td) => {
        tdReadPromises.push( new Promise((resolve,reject) => {
            readFile(td, "utf-8", (error, data) => {
                if(error){
                    reject(new Error("Unable to read TD file located with path : " + td));
                }
                resolve(data);
            });
        }));
    });
    return tdReadPromises;
}

const readConfigFile = async (confPath: string) => {
    return new Promise((resolve,reject) => {
        readFile(confPath, "utf-8", (error, data) => {
            if(error){
                reject(new Error("Unable to read configuration file!"));
            }
            resolve(data);
        });
    });
}

const startLocalMqttServer = (port: number) => {
    var aedes = require('aedes')();
    var server = net.createServer(aedes.handle);

    server.listen(port, () => {
        console.log('Local MQTT Broker listening on port', port);
    });
}

const startVirtualization = (config: ConfigFile, things: WoT.ThingDescription[], twins: WoT.ThingDescription[], models: string[]) => {
    // Set logging level according to config
    setLogLevel(config);

    // display config
    console.log("Servient configured with: ");
    console.log(JSON.stringify(config, null, 4));

    let servient = new Servient();

    // apply config
    Helpers.setStaticAddress(config.servient.staticAddress);
    
    // Initialize servers for corresponding servients and eventual client factories if twins are used
    if (config.servient.http) {
        let httpServer = new HttpServer(config.servient.http);

        servient.addServer(httpServer);
        servient.addServer(new WebSocketServer(httpServer));

        servient.addClientFactory(new HttpClientFactory(config.servient.http));
        servient.addClientFactory(new HttpsClientFactory(config.servient.http));
    }
   
    if (config.servient.coap) {
        let coapServer = new CoapServer(config.servient.coap.port);

        servient.addServer(coapServer);

        servient.addClientFactory(new CoapClientFactory(coapServer));
        servient.addClientFactory(new CoapsClientFactory());
    }

    if (config.servient.mqtt) {
        let mqttConfig = config.servient.mqtt;
        let mqttServer : MqttBrokerServer;

        if(mqttConfig.online){
            mqttServer = new MqttBrokerServer(mqttConfig.online.uri, mqttConfig.online.username, mqttConfig.online.password, mqttConfig.online.clientId);
        } else {
            mqttServer = new MqttBrokerServer(config.servient.staticAddress + ':' + mqttConfig.local.port);
        }
        servient.addServer(mqttServer);
        servient.addClientFactory(new MqttClientFactory());
    }
    
    //iterate through the things to add credentials
    let thingConfig = config.things
    Object.keys(thingConfig).forEach(thingId => { 
        if (thingConfig[thingId].credentials){
            let nbInstances = thingConfig[thingId].nInstance;
            //if there are multiple instances, there will be multiple ids
            // they are always structured like OLDID:n-INSTANCENUMBER
            // INSTANCENUMBER starts at 1
            if (nbInstances == 1) {
                servient.addCredentials({ [thingId]:thingConfig[thingId].credentials})
            } else {
                for (let index = 1; index <= nbInstances; index++) {
                    let nThingId = thingId+":n-"+index
                    servient.addCredentials({ [nThingId]: thingConfig[thingId].credentials })
                }
            }
        }
    });

    // Start Servient, virtual things and digital twins
    servient.start()
    .then((thingFactory) => {
        things.forEach((td: WoT.ThingDescription) => {
            if (config.things.hasOwnProperty(td.id)) {
                if(config.things[td.id].nInstance === 1){
                    new VirtualThing(td, thingFactory, config.things[td.id])
                        .produce().then(vt => vt.expose());
                    console.info(`Exposing ${td.title}`);
                }else{
                    var i;
                    for(i = 0; i<config.things[td.id].nInstance; i++){
                        new VirtualThing({...td, title: td.title + (i+1), id: td.id + ':n-' + (i+1)},
                                thingFactory,
                                config.things[td.id])
                            .produce().then(vt => vt.expose());
                        console.info(`Exposing instance ${i+1} of ${td.title}`);
                    }
                }
            } else {
                new VirtualThing(td, thingFactory)
                    .produce().then(vt => {
                        vt.expose();
                        console.info("Exposing " + td.title);
                    });
            }
        });
        twins.forEach((td) => {
            let dt: DigitalTwin;
            let id = td.id;
            if (config.things && config.things.hasOwnProperty(id)) { 
                dt = new DigitalTwin(td, thingFactory, config.things[id]);
            } else { 
                dt = new DigitalTwin(td, thingFactory);
            }
            let modelPath = models.pop();
            if (modelPath) {
                let model = require(join(process.cwd(), modelPath));
                model.addTwinModel(dt);
            }
            dt.expose();
        });
    })
    .catch((err) => {
        console.error(err);
    })
}

function setLogLevel(config: any) {
    // Replace console.log logging with winston
    let logger = winston.createLogger({
        level: 'debug',
        format: winston.format.cli(),
        transports: [
            new winston.transports.Console()
        ]
      });
    
    console.debug = (message:string) => { logger.debug(message); };
    console.log = (message:string) => { logger.verbose(message); };
    console.info = (message:string) => { logger.info(message); };
    console.warn = (message:string) => { logger.warn(message); };
    console.error = (message:string) => { logger.error(message); };

    const logLevels: {[key: number]: string} = {
        0: "error",
        1: "warn",
        2: "info",
        3: "verbose",
        4: "debug"
    }

    if (config.log && config.log.level >= 0 && config.log.level <= 4 ) {
        logger.level = logLevels[config.log.level]
    }
}

function printHelp() {
    console.info(`
Usage: shadow-thing [options] [TD]...

Options:
-c, --configfile <file>         load configuration from specified file
-t, --twin <file>[::<model>]    load the next TD file in digital-twin mode
                                (if a model file is given, it is loaded)
-h, --help                      show this help
-v, --version                   display virtual-thing version

examples:
shadow-thing
shadow-thing examples/td/coffee_machine_td.json
shadow-thing -t examples/td/coffee_machine_td.json
shadow-thing -c virtual-thing.conf.json examples/td/coffee_machine_td.json

If no TD is given, a default one is generated on runtime. The user is then
prompted to whether accept or reject using the generated configuration.
Upon rejection, a questionnaire will be executed to provide basic configuration.

configuration file syntax:
{
 "servient": {
     "staticAddress": STATIC,
     "http": {
         "port": PORT,
         "serverKey":KEYLOCATION,
         "serverCert":CERTIFICATELOCATION,
         "security":{
            "scheme":"basic"
         }
     },
     "coap": {
         "port": PORT
     }
 },
 "log": {
     "level": LOGLEVEL
 },
 "things": {
     THING_ID1: {
         "eventIntervals": {
             EVENT_ID1: INTERVAL,
             EVENT_ID2: INTERVAL
         },
         "twinPropertyCaching": {
             PROPERTY_ID1: INTERVAL,
             PROPERTY_ID2: INTERVAL,
         },
         "credentials": {
            "username": USERNAME,
            "password": PASSWORD
         }
     }
 }
}
virtual-thing.conf.json fields:
  ---------------------------------------------------------------------------
  All entries are optional except for security related ones after INTERVAL when HTTPS is used
  ---------------------------------------------------------------------------
  STATIC     : string with hostname or IP literal for static address config
  PORT      : integer defining the HTTP/COAP listening port
  LOGLEVEL   : integer from 0 to 4. A higher level means more logging output
                    ( error: 0, warn: 1, info: 2, log: 3, debug: 4 )
  THING_IDx  : string with the "id" of the thing be configured. must match TD
  EVENT_IDx  : string with the name of an event to be configured
  INTERVAL   : integer to be interpred as a number of seconds.
  KEYLOCATION: location of the key for HTTPS 
  CERTIFICATELOCATION: location of the certificate for HTTPS
  USERNAME   : username for basic auth
  PASSWORD   : password for basic auth`);
}

// Variables to contain parsed TD and config paths

var configPath: string;
var modelPaths: Array<string> = [];
var twinTdPaths: Array<string> = [];
var tdPaths: Array<string> = [];
var digitalTwinFlag: boolean; //global variable

// Main logic of script
if(process.argv.length > 2){
    parseArgs(modelPaths, twinTdPaths, tdPaths);
}

confirmConfiguration(configPath, tdPaths, twinTdPaths, digitalTwinFlag)
.then((config: ConfigFile) => {
    if(config.servient.mqtt && config.servient.mqtt.local){
        startLocalMqttServer(config.servient.mqtt.local.port);
    }
    Promise.all(readTdFiles(tdPaths))
    .then( (tdArgs: string[]) => {
        return Promise.all(readTdFiles(twinTdPaths))
        .then( (twinArgs: string[]) => {
            let tdList: WoT.ThingDescription[] = tdArgs.map(arg => JSON.parse(arg));
            let twinList: WoT.ThingDescription[] = twinArgs.map(arg => JSON.parse(arg));
            startVirtualization(config, tdList, twinList, modelPaths);
        });
    }).catch((error) => console.error(error));
}).catch((error) => {
    console.error(error);  
});
