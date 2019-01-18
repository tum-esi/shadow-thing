import * as WoT from "wot-typescript-definitions";

const jsf = require("json-schema-faker"); // When JSON Faker v0.5.0 Stable is realeased, change this to TS import
const Ajv = require('ajv');
const ajv = new Ajv();

/** Class representing a virtual WoT thing */
export class VirtualThing {
    public readonly config: any;
    public readonly thingDescription: WoT.ThingInstance;
    public thing: WoT.ExposedThing;

    /**
     * Create a virtual thing
     * @param thingDescription - A string representing a valid TD
     * @param factory - A WoTFactory attached to the node WoT servient where the thing should be exposed
     * @param config - An optional config object.
     */
    public constructor(thingDescription: WoT.ThingDescription, factory: WoT.WoTFactory, config?: VirtualThingConfig) {

        this.config = config;

        // Convert TD to an object and validate it. TODO: validate using JSON Schema
        this.thingDescription = <WoT.ThingInstance> JSON.parse(thingDescription);
        this.validateThingDescription();

        // Generate an ExposedThing
        this.thing = factory.produce(JSON.stringify(this.thingDescription));

        // Add property and action handlers
        this.addPropertyHandlers();
        this.addActionHandlers();
        this.generateEvents();
    }

    /** Expose the virtual thing on the servient */
    public expose() {
        this.thing.expose();
    }

    /** Validate this.thingDescription */
    private validateThingDescription() {
        if (!this.thingDescription.hasOwnProperty("id")) { 
            console.error("TD ERROR: Thing Description must contain an id."); 
            process.exit(); 
        }
        if (!this.thingDescription.hasOwnProperty("name")) { 
            console.error("TD ERROR: Thing Description must contain a name."); 
            process.exit(); 
        }
    }

    /** Add read and write handlers for properties. use JSON Faker */
    private addPropertyHandlers() {
        for (let property in this.thing.properties) {
            // add handlers to readable properties.
            if (this.thing.properties[property].writeOnly !== true) {
                this.thing.setPropertyReadHandler(
                    property,
                    () => { 
                        return new Promise( (resolve, reject) => { 
                            console.info("Property read: " + property); 
                            resolve(jsf(this.thing.properties[property]));
                        } );
                    }
                )
            }
            // add handlers to writable properties.
            if (this.thing.properties[property].readOnly !== true) { 
                this.thing.setPropertyWriteHandler(
                    property,
                    (received) => { 
                        return new Promise( (resolve, reject) => { 
                            // Validate input
                            if (!ajv.validate(this.thingDescription.properties[property], received)) { 
                                console.warn("WARNING: Invalid input received for property: " + property);
                                reject(new Error("Invalid property data."));
                                return;
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
        for (let action in this.thing.actions) {
            this.thing.setActionHandler(
                action, 
                (received) => { return new Promise( (resolve, reject) => { 
                    if (this.thingDescription.actions[action].input && !ajv.validate(this.thingDescription.actions[action].input, received)) { 
                        console.warn("WARNING: Invalid input received for action: " + action);
                        reject(new Error("Invalid action input."));
                        return;
                    }
                    console.info("Action -" + action + "- triggered with input: " + JSON.stringify(received));
                    if (typeof this.thingDescription.actions[action].output === "undefined") { 
                        resolve(); 
                    } else { 
                        resolve(jsf(this.thingDescription.actions[action].output)); 
                    } 
                } ); }
            );
        }
    }

    /** Randomly generate events. */
    private generateEvents() {
        for (let event in this.thing.events) {
            // Choose event interval randomly between 5 and 60seconds with 5 seconds increments, unless given in config.
            let interval = (this.config && this.config.eventIntervals && this.config.eventIntervals[event]) ?
                this.config.eventIntervals[event]*1000 : Math.floor(Math.random() * 11) * 5000 + 5000;
            // if interval is set to 0 in config file, don't generate events.
            if (this.config.eventIntervals[event] !== 0) {
                setInterval( 
                    async () => {
                        console.info("Emitting event: " + event);
                        console.info("Next in: " + interval/1000 + "s");
                        let emittedMessage = this.thingDescription.events[event].data ? jsf(this.thingDescription.events[event].data) : ""
                        this.thing.events[event].emit(emittedMessage);
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