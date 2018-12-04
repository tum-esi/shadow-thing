import * as WoT from "wot-typescript-definitions";
import { VirtualThing } from './virtual-thing';

export class DigitalTwin {
    public realThing: WoT.ConsumedThing;
    public virtualThing: VirtualThing;
    public thing: WoT.ExposedThing;
    public readonly config: any;
    public readonly thingDescription: WoT.ThingInstance;
    public customHandlers: { [key: string]: () => Promise<object> } // FIXME: Should this really be public ?

    public constructor(thingDescription: WoT.ThingDescription, factory: WoT.WoTFactory, config?: Object) {
        this.config = config;

        // Convert TD to an object.
        this.thingDescription = <WoT.ThingInstance> JSON.parse(thingDescription);

        // Consume thing
        this.realThing = factory.consume(thingDescription);

        // Create a virtual thing (name/id have to be different for the servient to work)
        let virtualTD = JSON.parse(thingDescription);
        virtualTD.name = "Virtual-Thing";
        virtualTD.id = "de:tum:ei:esi:fp:virt";
        this.virtualThing = new VirtualThing(JSON.stringify(virtualTD), factory);

        // Initialise custom handlers object
        this.customHandlers = {}

        // Generate thing and add handlers to it
        this.thing = factory.produce(JSON.stringify(this.thingDescription));
        this.addPropertyHandlers();
        this.addActionHandlers();
        this.addEventHandlers();
    }

    public expose() {
        this.thing.expose();
    }

    public addCustomPropertyHandler (property: string, handler: () => Promise<object>) {
        this.customHandlers[property] = handler; 
    }

    // Add read and write handlers for properties. use JSON Faker
    private addPropertyHandlers() {
        for (let property in this.thing.properties) {
            this.addPropertyReadHandler(property);
            // TODO: subscribe to observable.

            // add handlers to writable properties.
            if (this.thing.properties[property].readOnly !== true) { 
                this.thing.properties[property].writable = true; // FIXME: This part should be removed when node-wot core is updated.
                this.addPropertyWriteHandler(property);
            }
        }
    }

    private addPropertyReadHandler(property: string) {
        this.thing.setPropertyReadHandler(
            property,
            () => {
                return new Promise((resolve, reject) => {
                    this.realThing.properties[property].read()
                    .then((realResponse) => {
                        let annotatedResponse = { 
                            data: realResponse, // FIXME: convert to correct type based on TD
                            precision: 255
                        }
                        resolve(annotatedResponse)
                    })
                    .catch((realError) => {
                        // log error
                        let x = this
                        let handler = this.customHandlers[property] ? this.customHandlers[property]() : this.virtualThing.thing.properties[property].read()
                        handler.then((fakeResponse) => {
                            let annotatedResponse = { 
                                data: fakeResponse, // FIXME: convert to correct type based on TD
                                precision: 0
                            }
                            // annotate
                            resolve(annotatedResponse)
                        })
                        .catch((fakeError) => {
                            // log error
                            reject(realError)
                        })

                    })
                })
            }
        )
    }

    private addPropertyWriteHandler(property: string) {
        this.thing.setPropertyWriteHandler(
            property,
            (receivedValue) => { 
                return new Promise((resolve, reject) => {
                    this.realThing.properties[property].write(receivedValue)
                    .then((realResponse) => { 
                        // TODO: should we annotate this ? if not just return original promise.
                        resolve(realResponse); 
                    })
                    .catch((realError) => { 
                        reject(realError); 
                    })
                })
            }
        )
    }

    private addActionHandlers() {
        for (let action in this.thing.actions) {
            this.thing.setActionHandler(
                action, 
                (receivedInput) => {
                    return this.realThing.actions[action].invoke(receivedInput)
                }
            )
        }
    }

    private addEventHandlers() {
        for (let event in this.thingDescription.events) {
            this.realThing.events[event].subscribe(
                (realData) => { this.thing.events[event].emit(realData); },
                (RealError) => { this.thing.events[event].emit(RealError); } // FIXME: should we emit an error with a 200 status ?
            )
        }
    }
    
}