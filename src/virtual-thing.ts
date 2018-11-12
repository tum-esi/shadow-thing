import * as WoT from "wot-typescript-definitions";
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";
import { HttpClientFactory } from "@node-wot/binding-http";
import { HttpsClientFactory } from "@node-wot/binding-http";

// When JSON Faker v0.5.0 Stable is realeased, change this to import
const jsf = require("json-schema-faker");


export class VirtualThing extends Servient {
    public readonly config: any;
    public readonly thingDescription: WoT.ThingInstance;
    public thing: WoT.ExposedThing;

    public constructor(thingDescription: WoT.ThingDescription, config?: any) {
        super();

        // init config - TODO: config is actually being ignored. Add config handling.
        this.config = {
            servient: {
                staticAddress: "127.0.0.1"
            },
            log: {
                level: 2
            },
            http: {
                port: 8080
            }
        }

        // display
        console.info("Servient configured with");
        console.dir(this.config);

        // apply config
        if (typeof this.config.servient.staticAddress === "string") {
            Helpers.setStaticAddress(this.config.servient.staticAddress);
        }

        if (this.config.http !== undefined) {
            let httpServer = (typeof this.config.http.port === "number") ? new HttpServer(this.config.http.port) : new HttpServer();
            this.addServer(httpServer);
        }

        // Convert TD to an object and validate it.
        this.thingDescription = <WoT.ThingInstance> JSON.parse(thingDescription);
        if (!this.thingDescription.hasOwnProperty("id")) { 
            console.log("TD ERROR: Thing Description must contain an id."); 
            process.exit(); 
        }
        if (!this.thingDescription.hasOwnProperty("name")) { 
            console.log("TD ERROR: Thing Description must contain a name."); 
            process.exit(); 
        }

        // Start HTTP servers
        this.addClientFactory(new HttpClientFactory(this.config.http));
        this.addClientFactory(new HttpsClientFactory(this.config.http));

        // Start virtual thing
        super.start()
        .then((myFactory) => {
            this.thing = myFactory.produce(JSON.stringify(this.thingDescription));
            this.thing.expose()
        })
        .then(() => {
            // Add property and action handlers
            this.addPropertyHandlers();
            this.addActionHandlers();
            this.generateEvents();
        });
    }

    // Add read and write handlers for properties. use JSON Faker
    private addPropertyHandlers() {
        for (let property in this.thing.properties) {
            this.thing.setPropertyReadHandler(
                property,
                () => { 
                    return new Promise( (resolve, reject) => { 
                        console.log("Property read: " + property); 
                        resolve(jsf(this.getPropertySchema(property)));
                    } );
                }
            )
            if (this.thing.properties[property].writable) { console.log("WARNING: property write handler needs to be set."); }
        }
    }

    // Print to the console whenever an action is triggered
    private addActionHandlers() {
        for (let action in this.thing.actions) {
            this.thing.setActionHandler(
                action, 
                (received) => { return new Promise( (resolve, reject) => { console.log("Action Triggered: " + action); resolve(); } ); }
            );
        }
    }

    // Randomly generate events. // TODO: maybe give the user the option to set the generation intervals in config
    private generateEvents() {
        for (let event in this.thing.events) {
            // Interval between 5 and 60seconds, with 5 seconds increments
            let interval = Math.floor(Math.random() * 11) * 5000 + 5000;
            setInterval( 
                async () => {
                    console.log("Emitting event: " + event);
                    console.log("Next in: " + interval/1000 + "s");
                    let emittedMessage = this.thingDescription.events[event].data ? jsf(this.thingDescription.events[event].data) : ""
                    this.thing.events[event].emit(emittedMessage);
                }, 
                interval
            );
        }
    }

    // Return a JSON Schema that describes a given property
    private getPropertySchema(property: string): object {
        let schema: {[key: string]: any} = {
            type: this.thingDescription.properties[property].type,
        };
        if (this.thingDescription.properties[property].hasOwnProperty("const")) {
            schema.enum = [this.thingDescription.properties[property].const]
            return schema;
        }
        if (this.thingDescription.properties[property].hasOwnProperty("enum")) {
            schema.enum = this.thingDescription.properties[property].enum
            return schema;
        }
        return schema;        
    }
}