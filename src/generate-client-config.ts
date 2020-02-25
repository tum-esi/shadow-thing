import * as fs from "fs";



const SERVER_CONFIG_PATH = "./config-files/server-config.json";
const PORT_START = 8080;

let clientConfig:any;
clientConfig = {};
var clients = [];

let serverConfig = JSON.parse(fs.readFileSync(SERVER_CONFIG_PATH, 'utf-8'))


let clientInstance = parseInt(process.argv.slice(2)[0]);
let clientMeasurement = parseInt(process.argv.slice(3)[0]);



// for now we are assuming that there is only one servient object
for (let i=0; i<serverConfig.servients[0].instances;i++){
    //iterating through ports\
    var curPort = PORT_START+i;
    for (let j=1; j<= serverConfig.servients[0].things["./examples/td/coffee_machine_td.json"].instances; j++){
        clients.push(
            {
                instances: clientInstance,
                protocol: serverConfig.servients[0].protocol,
                measures: clientMeasurement,
                thingURL: serverConfig.staticAddress + ":" + curPort +"/Virtual-Coffee-Machine_"+(i+1)+"_"+j,
                events_to_sub: [],
                actions_to_inv: {
                    brew: 0.1
                },
                prop_to_read: {
                    waterStatus: 0.1
                }
            }
        );
    }

}

// console.log(JSON.stringify(clients))
clientConfig.clients=clients;
// console.log(clientConfig)
fs.writeFileSync("config-files/cor-client-config.json",JSON.stringify(clientConfig))