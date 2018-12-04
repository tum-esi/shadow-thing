import * as WoT from "wot-typescript-definitions";
import { VirtualThing } from './virtual-thing';

export class DigitalTwin {
    public realThing: WoT.ConsumedThing;
    public virtualThing: VirtualThing;
    public thing: WoT.ExposedThing;
    public readonly config: any;
    public readonly thingDescription: WoT.ThingInstance;

    public constructor(thingDescription: WoT.ThingDescription, factory: WoT.WoTFactory, config?: Object) {
        this.config = config;

        // Convert TD to an object.
        this.thingDescription = <WoT.ThingInstance> JSON.parse(thingDescription);

        // Consume thing
        this.realThing = factory.consume(thingDescription);

        // Create a virtual thing
        this.virtualThing = new VirtualThing(thingDescription, factory);

        // Generate thing and add handlers to it
        this.thing = factory.produce(JSON.stringify(thingDescription));
    }

    public expose() {
        this.thing.expose();
    }

    // Add read and write handlers for properties. use JSON Faker
    private addPropertyHandlers() {
        for (let property in this.thing.properties) {
            this.addPropertyReadHandler(property);

            // add handlers to writable properties.
            if (this.thing.properties[property].readOnly !== true) { 
                this.thing.properties[property].writable = true; // FIXME: This part should be removed when node-wot core is updated.
                this.addPropertyReadHandler(property);
            }
        }
    }

    private addPropertyReadHandler(property: string) {
        this.thing.setPropertyReadHandler(
            property,
            () => {
                return new Promise((resolve, rejects) => {
                    this.realThing.properties[property].read()
                    .then((received) => {
                        // annotate
                        resolve(received)
                    })
                    .catch((error) => {
                        // log error
                        this.virtualThing.thing.properties[property].read()
                        .then((received) => {
                            // annotate
                            resolve(received)
                        })
                        .catch((error) => {
                            // log error
                            rejects(error)
                        })

                    })
                })
            }
        )
    }

    private addPropertywriteHandler(property: string) {
        this.thing.setPropertyWriteHandler(
            property,
            () => { 
                return new Promise((resolve, rejects) => {
                    this.realThing.properties[property].read()
                    .then((received) => { resolve(received)})
                    .catch()
                })
            }
        )
    }

    private addActionHandlers() {
    }
    
}