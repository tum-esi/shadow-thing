import * as WoT from "wot-typescript-definitions"; 

const inquirer = require("inquirer");

interface staticAddressResponse {
    staticAddress: string
}

let staticAddressQuery = {
    type: 'input',
    message: 'Enter static address : ',
    default: 'localhost',
    name: 'staticAddress'
}   

interface protocolTypeResponse {
    protocols: Array<string>
}

let protocolTypeQuery = {
    type: 'checkbox',
    message: 'Select desired protocols : ',
    name: 'protocols',
    choices: [ { name: "http" }, { name: "coap"} ],
    validate: (answer: Array<object>) => {
        if(answer.length < 1){
            return 'Select at least one protocol!';
        }
        return true;
    }
}

interface portQueryResponse {
    port: number
}

let portQuery = {
    type: 'number',
    name: 'port',
    message: '',
    validate: (answer: number) => {
        if(!(answer >= 1024 && answer <= 49151)){
            return "Port not allowed.";
        }
        return true;
    }
}

interface logLevelResponse {
    level: number
}

let logLevelQuery = {
    type: 'list',
    message: 'Select log level : ',
    name: 'level',
    choices: [0, 1, 2, 3, 4]
}

interface eventIntervalResponse {
    eventIntervals: number
}

let eventIntervalQuery = {
    type: 'number',
    message: 'Enter event interval in seconds for all events : ',
    name: 'eventIntervals',
    validate: (answer: number) => {
        if(typeof answer !== 'number' || isNaN(answer)){
            return "Not a number.";
        }
        return true;
    }
}

interface twinPropertyCachingResponse {
    twinPropertyCaching: number
}

let twinPropertyCachingQuery = {
    type: 'number',
    message: 'Enter property caching interval in seconds for digital twins : ',
    name: 'twinPropertyCaching',
    validate: (answer: number) => {
        if(typeof answer !== 'number' || isNaN(answer)){
            return "Not a number.";
        }
        return true;
    }
}

interface defaultQueryResponse {
    choice: string;
}

export const defaultQuery = async () => {
    return inquirer.prompt({
        type: 'list',
        name: 'choice',
        message: 'Use default configuration?',
        choices: ['yes', 'no']
    }).then((response: defaultQueryResponse) => response.choice);
}

const protocolsQuery = async () => {
    let protocolConfig = {};
    return await inquirer.prompt(protocolTypeQuery).then( async (response: protocolTypeResponse) => {
        if(response.protocols.includes('http')){
            portQuery.message = "Enter port for HTTP protocol : ";
            await inquirer.prompt(portQuery).then((responseHttp: portQueryResponse) => {
                Object.assign(protocolConfig, { http: responseHttp });
            });
        }
        return response;
    }).then( async (response: protocolTypeResponse) => {
        if(response.protocols.includes('coap')){
            portQuery.message = "Enter port for CoAP protocol : ";
            await inquirer.prompt(portQuery).then((responseCoAP: portQueryResponse) => {
                Object.assign(protocolConfig, { coap: responseCoAP });
            });
        }
    }).then( () => protocolConfig);
}

const thingQuery = async (thingList: Array<WoT.ThingInstance>) => {
    let things = {};
    thingList.forEach( (thing: WoT.ThingInstance) => {
        Object.assign(things, { [thing.id]: {} });
    });
    return inquirer.prompt(eventIntervalQuery).then( ( eventTime: eventIntervalResponse ) => {
        return inquirer.prompt(twinPropertyCachingQuery).then( ( cachingTime: twinPropertyCachingResponse ) => {
            thingList.forEach( (thing: WoT.ThingInstance) => {
                let container = {};
                let eventInter = {};
                let twinProp = {};

                for(let event in thing.events){
                    Object.assign(eventInter, {[event]: eventTime.eventIntervals});
                }
                Object.assign(container, { eventIntervals: eventInter });

                for(let prop in thing.properties){
                    Object.assign(twinProp, {[prop]: cachingTime.twinPropertyCaching});
                }
                Object.assign(container, { twinPropertyCaching: twinProp });

                Object.assign(things, { [thing.id]: container });
            });
        });
    }).then( () => things );        
}

export const configurationQuery = async (thingList: Array<WoT.ThingInstance>) => {
    let config = {
        servient: {},
        log: {},
        things: {}    
    };

    return inquirer.prompt(staticAddressQuery).then( async (address: staticAddressResponse) => {
        await protocolsQuery().then( (protocols) => {
            config.servient = {
                ...address,
                ...protocols
            };
        });

        return inquirer.prompt(logLevelQuery);
    
    }).then( (logLevel: logLevelResponse) => {
        config.log = logLevel;
        return thingQuery(thingList);
    
    }).then( (things: object) => {
        config.things = things;
        return config;
    });
}
