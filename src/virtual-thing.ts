import * as WoT from "wot-typescript-definitions";
import * as path from "path"
import * as fs from "fs";

const jsf = require("json-schema-faker"); // When JSON Faker v0.5.0 Stable is realeased, change this to TS import
const Ajv = require('ajv');

// Initialize Ajv and add JSON schema for TD Validation 
var ajv = new Ajv();
var schemaLocation = path.join(__dirname, '..', 'validation-schemas' ,'td-json-schema-validation.json');
var schema = fs.readFileSync(schemaLocation);
ajv.addSchema(schema, 'td');

/** Class representing a virtual WoT thing */
export class VirtualThing {
    public readonly config: any;
    public readonly thingDescription: WoT.ThingDescription;
    public thing: WoT.ExposedThing = undefined;

    private factory: WoT.WoT;
    
    /**
     * Create a virtual thing
     * @param thingDescription - A string representing a valid TD
     * @param factory - A WoTFactory attached to the node WoT servient where the thing should be exposed
     * @param config - An optional config object.
     */
    public constructor(td: WoT.ThingDescription, factory: WoT.WoT, config?: VirtualThingConfig) {
        
        this.config = config;
        this.factory = factory;

        // Convert TD to an object and validate it.
        this.thingDescription = td;
        this.validateThingDescription();        
    }

    /** Produce thing from TD */
    public produce() : Promise<VirtualThing> {
        return new Promise((resolve) => {
            if(this.thing == undefined){
                // Generate an ExposedThing
                this.factory.produce(this.thingDescription).then(thing =>{
                    this.thing = thing;
                    // Add property and action handlers
                    this.addPropertyHandlers();
                    this.addActionHandlers();
                    this.generateEvents();
                    resolve(this);
                });
            }else{
                resolve(this);
            }            
        });
    }

    /** Expose the virtual thing on the servient */
    public expose() {
        this.thing.expose();
    }
    
    /** Validate this.thingDescription **/
    private validateThingDescription(){ //TODO better error messages
        // TD Schema Validation Test 
        if(!ajv.validate('td', JSON.stringify(this.thingDescription))){
            console.error("Invalid TD specified.");
            process.exit();
        }
    }
    
    /**
     * The prefixes "PR:", "PW:", "A:" and "E:" are used to determine 
     * the class of the following console output. (Property Read,
     * Property Write, Action and Event)
     */

    /** Add read and write handlers for properties. use JSON Faker */
    private addPropertyHandlers() {
        for (let property in this.thing.getThingDescription().properties) {
            // add handlers to readable properties.
            if (this.thing.getThingDescription().properties[property].writeOnly !== true) {
                this.thing.setPropertyReadHandler(
                    property,
                    () => { 
                        return new Promise( (resolve, reject) => { 
                            console.info("PR: Property read: " + property); 
                            resolve(jsf(this.thing.getThingDescription().properties[property]));
                        } );
                    }
                )
            }
            // add handlers to writable properties.
            if (this.thing.getThingDescription().properties[property].readOnly !== true) { 
                this.thing.setPropertyWriteHandler(
                    property,
                    (received) => { 
                        return new Promise( (resolve, reject) => { 
                            // Validate input
                            if (!ajv.validate(this.thingDescription.properties[property], received)) { 
                                console.warn("WARNING: Invalid input received for property: " + property);
                                reject(new Error("Invalid property data."));
                                return;
                            } else {
                                console.info("PW: Property write value: " + received + " to property: " + property);
                            }

                            // Update the read handler to always return the written value.
                            this.thing.setPropertyReadHandler(
                                property, 
                                () => {
                                    return new Promise((resolve, reject) => { resolve(received); });
                                } 
                            );
                            resolve();
                        });
                    }
                )
            }
        }
    }

    /** Print to the console whenever an action is triggered */
    private addActionHandlers() {
        for (let action in this.thing.getThingDescription().actions) {
            this.thing.setActionHandler(
                action, 
                (received) => { return new Promise( (resolve, reject) => { 
                        if (this.thingDescription.actions[action].input) {
                            if (!ajv.validate(this.thingDescription.actions[action].input, received)) { 
                                console.warn("WARNING: Invalid input received for action: " + action);
                                reject(new Error("Invalid action input."));
                                return;
                            }else{
                                console.info("A: Action -" + action + "- triggered with input: " + JSON.stringify(received));
                            }
                        }else{
                            console.info("A: Action -" + action + "- triggered.");
                        }                    

                        if (this.thingDescription.actions[action].output) { 
                            resolve(jsf(this.thingDescription.actions[action].output));
                        } else {
                            resolve();
                        }
                    }); 
                }
            );
        }
    }

    /** Randomly generate events. */
    private generateEvents() {
        for (let event in this.thing.getThingDescription().events) {
            // Choose event interval randomly between 5 and 60seconds with 5 seconds increments, unless given in config.
            let interval = (this.config && this.config.eventIntervals && this.config.eventIntervals[event]) ?
                this.config.eventIntervals[event]*1000 : Math.floor(Math.random() * 11) * 5000 + 5000;
            // if interval is set to 0 in config file, don't generate events.
            if (this.config.eventIntervals[event] !== 0) {
                setInterval( 
                    async () => {
                        console.info("E: Emitting event: " + event);
                        console.info("Next in: " + interval/1000 + "s");
                        let emittedMessage = this.thingDescription.events[event].data ? jsf(this.thingDescription.events[event].data) : ""
                        this.thing.emitEvent(event,emittedMessage);
                    }, 
                    interval
                );
            }
        }
    }
}

export type VirtualThingConfig = {
    eventIntervals?: {
        [key: string]: number
    },
    twinPropertyCaching?: {
        [key: string]: number
    }
}
