import { VirtualThing } from "./virtual-thing"
import { readFile } from "fs";
import { join } from "path";

// Default relative paths for the config file and the thing description
const defaultConfig = "../virtual-thing.conf.json";
const defaultTd = "../Coffee/coffee_machine_td.json"

// Convert relative paths to absolute paths
let configPath = join(__dirname, defaultConfig);
let tdPath = join(__dirname, defaultTd);

let configPresentFlag = false;
if (process.argv.length > 2) {
    let argv = process.argv.slice(2);
    argv.forEach( (arg) => {
        if (configPresentFlag) {
            configPresentFlag = false;
            configPath = arg;
            argv.shift();
        
        } else if (arg.match(/^(-c|--configfile)$/i)) {
            configPresentFlag = true;
            argv.shift();

        } else if (arg.match(/^(-h|--help|\/?|\/h)$/i)) {
            console.log(`Usage: virtual-thing [options] [TD]`);
            process.exit(0);
        }
    });
    if (argv.length > 0) { tdPath = argv[0]; }
}

readFile( configPath, "utf-8", (err, config) => {
    if (err) { console.log(err); process.exit(); }
    readFile( tdPath, "utf-8", (err, td) => {
        if (err) { console.log(err); process.exit(); }
        let virtualThing = new VirtualThing(td, config);
    });
});