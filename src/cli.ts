#!/usr/bin/env node
/********************************************************************************
 * Copyright (c) 2018 Hassib Belhaj & www.esi.ei.tum.de
 * MIT Licence - see LICENSE
 ********************************************************************************/

import { VirtualThing } from "./virtual-thing"
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";
import { readFile } from "fs";
import { join } from "path";

// Default relative paths for the config file and the thing description
const defaultConfig = "../virtual-thing.conf.json";
const defaultTd = "../examples/td/coffee_machine_td.json"

main();

/** Parse command line arguments and start a virtual thing for each given TD */
function main() {
    // Parse command line args
    let paths: {configPath: string, tdPaths: Array<string>} = parseArgs();

    // Async read of config and TD files from disk
    let readPromises: Array<Promise<string>> = [];

    readPromises.push( new Promise((resolve, reject) => {
        readFile( paths.configPath, "utf-8", (err, config) => {
            if (err) { console.log(err); process.exit(); }
            resolve(config);
        });
    }) );

    paths.tdPaths.forEach((td) => {
        readPromises.push( new Promise((resolve, reject) => {
            readFile( td, "utf-8", (err, td) => {
                if (err) { console.log(err); process.exit(); }
                resolve(td);
            });
        }) );
    });

    Promise.all(readPromises).then( (args) => { startVirtualization(args[0], args.slice(1)) } )
}

function parseArgs() {
    // Variables to contain parsed TD and config paths
    let configPath = "";
    let tdPaths : Array<string> = [];

    if (process.argv.length > 2) {
        let argv = process.argv.slice(2);
        let configPresentFlag = false;
        argv.forEach( (arg) => {
            if (configPresentFlag) {
                configPresentFlag = false;
                configPath = arg;
            
            } else if (arg.match(/^(-c|--configfile)$/i)) {
                configPresentFlag = true;

            } else if (arg.match(/^(-h|--help)$/i)) {
                printHelp();
                process.exit(0);

            } else if (arg.match(/^(-c|--version)$/i)) {
                console.log(require("../package.json").version);

            } else {
                tdPaths.push(arg);
            }
        });
    }
    // if no arguments are given, use the default paths ( after converting them to absolute paths )
    if (tdPaths.length === 0) { 
        console.log("No Thing Description given. Using default TD.")
        tdPaths = [join(__dirname, defaultTd)] 
    }

    if (configPath === "") { 
        console.log("No config file given. Using default Config.")
        configPath = join(__dirname, defaultConfig) 
    }

    return {configPath, tdPaths};
}

function startVirtualization(config: string, tds: Array<string>) {
    let conf = JSON.parse(config);

    // display config
    console.info("Servient configured with");
    console.dir(conf);

    let servient = new Servient();

    // apply config
    if (typeof conf.servient.staticAddress === "string") {
        Helpers.setStaticAddress(conf.servient.staticAddress);
    }

    if (conf.servient.http !== undefined) {
        let httpServer = (typeof conf.servient.http.port === "number") ? new HttpServer(conf.servient.http) : new HttpServer();
        servient.addServer(httpServer);
    }

    // Start Servient and virtual things
    servient.start()
    .then((thingFactory) => {
        tds.forEach((td) => {
            let id = JSON.parse(td).id;
            if (conf.things && conf.things.hasOwnProperty(id)) { 
                let vt = new VirtualThing(td, thingFactory, conf.things[id]);
                vt.expose();
            } else { 
                let vt = new VirtualThing(td, thingFactory);
                vt.expose();
            }
        })
    })
    .catch((err) => {
        console.log(err);
    })
}

function printHelp() {
    console.log(`
Usage: virtual-thing [options] [TD]...
virtual-thing
virtual-thing examples/td/coffee_machine_td.json
virtual-thing -c virtual-thing.conf.json examples/td/coffee_machine_td.json
virtual-thing --version

Create a Virtual Thing based on a given Thing Description.
If no TD is given, the default TD in examples/td/coffee_machine_td.json is loaded.
If the config file 'virtual-thing.conf.json' exists, that configuration is applied.

Options:
-v, --version             display virtual-thing version
-c, --configfile <file>   load configuration from specified file
-h, --help                show this help

virtual-thing.conf.json syntax:
{
 "servient": {
     "staticAddress": STATIC,
     "http": {
         "port": HPORT,
 },
 "things": {
     THING_ID1: {
         "eventIntervals": {
             EVENT_ID1: INTERVAL,
             EVENT_ID2: INTERVAL
         }
     }
 }
}`);
}