import * as WoT from "wot-typescript-definitions";
import { VirtualThing } from './virtual-thing';

export class DigitalTwin {
    public realThing: WoT.ConsumedThing;
    public virtualThing: VirtualThing;
    public thing: WoT.ExposedThing;
    public readonly config: any;
    public readonly thingDescription: WoT.ThingInstance;
    private customHandlers: { [key: string]: DTCustomHandler };
    private lastReadValues : { [key: string]: {value: any, timestamp: Date} };

    public constructor(thingDescription: WoT.ThingDescription, factory: WoT.WoTFactory) {
        // Convert TD to an object.
        this.thingDescription = <WoT.ThingInstance> JSON.parse(thingDescription);

        // Consume thing
        this.realThing = factory.consume(thingDescription);

        // Create a virtual thing (name/id have to be different for the servient to work)
        let virtualTD = JSON.parse(thingDescription);
        virtualTD.name = "Virtual-Thing";
        virtualTD.id = "de:tum:ei:esi:fp:virt";
        this.virtualThing = new VirtualThing(JSON.stringify(virtualTD), factory);

        // Initialise custom handlers and last read values objects
        this.customHandlers = {};
        this.lastReadValues = {};

        // Generate thing and add handlers to it
        this.thing = factory.produce(JSON.stringify(this.thingDescription));
        this.addPropertyHandlers();
        this.addActionHandlers();
        this.addEventHandlers();
    }

    public expose() {
        this.thing.expose();
    }

    public addCustomPropertyReadHandler (property: string, handler: DTCustomHandler) {
        this.customHandlers[property] = handler; 
    }

    private addPropertyReadHandler(property: string) {
        this.thing.setPropertyReadHandler(
            property,
            () => {
                return new Promise((resolve, reject) => {
                    this.realThing.properties[property].read()
                    .then((realResponse) => {
                        // Save received value for future use.
                        this.lastReadValues[property] = { 
                            value: JSON.parse(realResponse), 
                            timestamp: new Date()
                        }
                        // anontate response with accuracy data
                        let annotatedResponse = { 
                            data: JSON.parse(realResponse),
                            accuracy: 255
                        }
                        resolve(annotatedResponse)
                    })
                    .catch((realError) => {
                        console.warn("Could not read property " + property + " from real thing: " + realError);

                        // If a custom handler is defined use it, otherwise default to virtualThing.
                        if (this.customHandlers[property]) {
                            let lastValue: any = null;
                            let timestamp: Date = null;
                            if (this.lastReadValues[property]) {
                                lastValue = this.lastReadValues[property].value;
                                timestamp = this.lastReadValues[property].timestamp;
                            };
                            this.customHandlers[property](lastValue, timestamp)
                            .then((customResponse) => {
                                let annotatedResponse = { 
                                    data: customResponse.data,
                                    accuracy: customResponse.accuracy
                                }
                                resolve(annotatedResponse)
                            })
                            .catch((customError) => {
                                reject(customError) // Should this return the custom or the real error ?
                            })
                        } else {
                            this.virtualThing.thing.properties[property].read()
                            .then((fakeResponse) => {
                                let annotatedResponse = { 
                                    data: JSON.parse(fakeResponse),
                                    accuracy: 0
                                }
                                resolve(annotatedResponse)
                            })
                            .catch((fakeError) => {
                                console.error("ERROR: Could not read property " + property + " from virtual thing: " + fakeError);
                                reject(realError)
                            })
                        }
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

    // Add read and write handlers for properties.
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