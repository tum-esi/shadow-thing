#!/usr/bin/env node
/********************************************************************************
 * Copyright (c) 2019 Hassib Belhaj & www.esi.ei.tum.de
 * MIT Licence - see LICENSE
 ********************************************************************************/

import { VirtualThing } from "./virtual-thing"
import { DigitalTwin } from "./digital-twin"
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer, HttpClientFactory } from "@node-wot/binding-http";
import { readFile } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import * as winston from "winston";

// Default relative paths for the config file and the thing description
const defaultConfig = "../virtual-thing.conf.json";
const defaultTd = "../examples/td/coffee_machine_td.json"

parseArgs();

function parseArgs() {
    // Variables to contain parsed TD and config paths
    let configPath = "";
    let tdPaths : Array<string> = [];
    let twinTdPaths : Array<string> = [];
    let modelPaths: Array<string> = [];

    if (process.argv.length > 2) {
        let argv = process.argv.slice(2);
        let configPresentFlag = false;
        let digitalTwinFlag = false;
        argv.forEach( (arg) => {
            if (configPresentFlag) {
                configPresentFlag = false;
                configPath = arg;

            } else if (digitalTwinFlag) {
                digitalTwinFlag = false;
                modelPaths.push(arg.split("::")[1]);
                twinTdPaths.push(arg.split("::")[0]);

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
                tdPaths.push(arg);
            }
        });
    }

    // if no arguments are given, ask user if we should use the default paths.
    if ((tdPaths.length === 0 && twinTdPaths.length === 0) || configPath === "") {
        confirmDefaultPaths(configPath, tdPaths, twinTdPaths, modelPaths);
    } else {
        readFiles(configPath, tdPaths, twinTdPaths, modelPaths);
    }
}

function confirmDefaultPaths(configPath: string, tdPaths: string[], twinTdPaths: string[], modelPaths: string[]) {
    const readline = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    if (configPath === "") { 
        configPath = join(__dirname, defaultConfig);
        console.warn(`No config file given. Using default Config: '${configPath}'`);
    }

    if (tdPaths.length === 0 && twinTdPaths.length === 0) { 
        readline.question( 
            "No Thing Description given. Start a virtual thing with the default TD? (yes/no) ", 
            (answer) => {
                if (answer.match(/^(yes|y)$/i)) { 
                    tdPaths = [join(__dirname, defaultTd)];
                    readFiles(configPath, tdPaths, twinTdPaths, modelPaths);
                } else {
                    console.error("Virtual thing can not start without a Thing Description. \n" +
                    "For more informations, run: virtual-thing --help");
                    process.exit();
                }
                readline.close();
            }
        );
    } else {
        readFiles(configPath, tdPaths, twinTdPaths, modelPaths);
    }
}

/** Parse command line arguments and start a virtual thing for each given TD */
function readFiles(configPath: string, tdPaths: string[], twinTdPaths: string[], modelPaths: string[]) {
    let readPromises: Array<Promise<string>> = [];

    // Async read of config and TD files from disk
    readPromises.push( new Promise((resolve, reject) => {
        readFile( configPath, "utf-8", (err, config) => {
            if (err) { console.error(err); process.exit(); }
            resolve(config);
        });
    }) );

    tdPaths.forEach((td) => {
        readPromises.push( new Promise((resolve, reject) => {
            readFile( td, "utf-8", (err, td) => {
                if (err) { console.error(err); process.exit(); }
                resolve(td);
            });
        }) );
    });

    twinTdPaths.forEach((td) => {
        readPromises.push( new Promise((resolve, reject) => {
            readFile( td, "utf-8", (err, td) => {
                if (err) { console.error(err); process.exit(); }
                resolve(td);
            });
        }) );
    });

    Promise.all(readPromises).then( (args) => {
        startVirtualization(args[0], args.slice(1, tdPaths.length+1), args.slice(tdPaths.length+1), modelPaths) 
    })
}

function startVirtualization(config: string, things: string[], twins: string[], models: string[]) {
    let conf = JSON.parse(config);

    // Set logging level according to config
    setLogLevel(conf);

    // display config
    console.log("Servient configured with: ");
    console.log(conf);

    let servient = new Servient();

    // apply config
    if (typeof conf.servient.staticAddress === "string") {
        Helpers.setStaticAddress(conf.servient.staticAddress);
    }

    if (conf.servient.http !== undefined) {
        let httpServer = (typeof conf.servient.http.port === "number") ? new HttpServer(conf.servient.http) : new HttpServer();
        servient.addServer(httpServer);
    }

    // Add clientFactory to servient if twins are present
    if (twins.length > 0) {servient.addClientFactory(new HttpClientFactory());}

    // Start Servient, virtual things and digital twins
    servient.start()
    .then((thingFactory) => {
        things.forEach((td) => {
            let id = JSON.parse(td).id;
            if (conf.things && conf.things.hasOwnProperty(id)) { 
                let vt = new VirtualThing(td, thingFactory, conf.things[id]);
                vt.expose();
            } else { 
                let vt = new VirtualThing(td, thingFactory);
                vt.expose();
            }
        })
        twins.forEach((td) => {
            let dt: DigitalTwin;
            let id = JSON.parse(td).id;
            if (conf.things && conf.things.hasOwnProperty(id)) { 
                dt = new DigitalTwin(td, thingFactory, conf.things[id]);
            } else { 
                dt = new DigitalTwin(td, thingFactory);
            }
            let modelPath = models.pop();
            if (modelPath) {
                let model = require(join(process.cwd(), modelPath));
                model.addTwinModel(dt);
            }
            dt.expose()
        })
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
Usage: virtual-thing [options] [TD]...

Options:
-c, --configfile <file>         load configuration from specified file
-t, --twin <file>[::<model>]    load the next TD file in digital-twin mode
                                (if a model file is given, it is loaded)
-h, --help                      show this help
-v, --version                   display virtual-thing version

examples:
virtual-thing
virtual-thing examples/td/coffee_machine_td.json
virtual-thing -t examples/td/coffee_machine_td.json
virtual-thing -c virtual-thing.conf.json examples/td/coffee_machine_td.json

If no TD is given, the default TD examples/td/coffee_machine_td.json is used.
If the file 'virtual-thing.conf.json' exists, it is used for configuration.

virtual-thing.conf.json syntax:
{
 "servient": {
     "staticAddress": STATIC,
     "http": {
         "port": HPORT,
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
         }
     }
 }
}
virtual-thing.conf.json fields:
  ---------------------------------------------------------------------------
  All entries are optional
  ---------------------------------------------------------------------------
  STATIC     : string with hostname or IP literal for static address config
  HPORT      : integer defining the HTTP listening port
  LOGLEVEL   : integer from 0 to 4. A higher level means more logging output
                    ( error: 0, warn: 1, info: 2, log: 3, debug: 4 )
  THING_IDx  : string with the "id" of the thing be configured. must match TD
  EVENT_IDx  : string with the name of an event to be configured
  INTERVAL   : integer to be interpred as a number of seconds.`);
}