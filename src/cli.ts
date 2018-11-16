import { VirtualThing } from "./virtual-thing"
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";
import { readFile } from "fs";
import { join } from "path";

// Default relative paths for the config file and the thing description
const defaultConfig = "../virtual-thing.conf.json";
const defaultTd = "../Coffee/coffee_machine_td.json"

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

        } else if (arg.match(/^(-h|--help|\/?|\/h)$/i)) {
            console.log(`Usage: virtual-thing [options] [TD]`);
            process.exit(0);
        } else {
            tdPaths.push(arg);
        }
    });
}
// if no arguments are giiven, use the default paths ( after converting them to absolute paths )
if (tdPaths.length === 0) { 
    console.log("No Thing Description given. Using default TD.")
    tdPaths = [join(__dirname, defaultTd)] 
}

if (configPath === "") { 
    console.log("No config file given. Using default Config.")
    configPath = join(__dirname, defaultConfig) 
}

// Async read of config and TD files from disk
let readPromises: Array<Promise<string>> = [];

readPromises.push( new Promise((resolve, reject) => {
    readFile( configPath, "utf-8", (err, config) => {
        if (err) { console.log(err); process.exit(); }
        resolve(config);
    });
}) );

tdPaths.forEach((td) => {
    readPromises.push( new Promise((resolve, reject) => {
        readFile( td, "utf-8", (err, td) => {
            if (err) { console.log(err); process.exit(); }
            resolve(td);
        });
    }) );
});

Promise.all(readPromises).then( (args) => { startVirtualization(args[0], args.slice(1)) } )




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
        let httpServer = (typeof conf.servient.http.port === "number") ? new HttpServer(conf.servient.http.port) : new HttpServer();
        servient.addServer(httpServer);
    }

    // Start Servient and virtual things
    servient.start()
    .then((thingFactory) => {
        tds.forEach((td) => {
            let id = JSON.parse(td).id;
            if (conf.things && conf.things.hasOwnProperty(id)) { 
                new VirtualThing(td, thingFactory, conf.things[id]); 
            } else { 
                new VirtualThing(td, thingFactory); 
            }
        })
    })
    .catch((err) => {
        console.log(err);
    })
}