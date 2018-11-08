import * as WoT from "wot-typescript-definitions";
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";
import { HttpClientFactory } from "@node-wot/binding-http";
import { HttpsClientFactory } from "@node-wot/binding-http";


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

    private addPropertyHandlers() {
        // Add read and write handlers for properties. use JSON Faker
    }

    // Print to the console whenever an action is triggered
    private addActionHandlers() {
        for (let action in this.thing.actions) {
            this.thing.setActionHandler(
                action, 
                (received) => { return new Promise<any>( (resolve, reject) => { resolve(console.log("Action Triggered!")); } ); }
            );
        }
    }

    private generateEvents() {
        // Randomly generate events. // TODO: maybe give the user the option to set the generation intervals
    }
}