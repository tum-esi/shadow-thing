// TODO: This functionality should be merged in the normal cli

import { DigitalTwin } from "./digital-twin";
import { Servient } from "@node-wot/core";
import { HttpServer, HttpClientFactory } from "@node-wot/binding-http";

let jsontd = { id: "de:tum:ei:esi:fp:coffee", name: "Virtual-Coffee-Machine", description: "A virtual coffee machine to learn the WoT TD standard", base: "http://localhost:8080/virtual-coffee-machine/", security: [ { scheme: "nosec" } ], properties: { state: { type: "string", readOnly: false, enum: [ "Ready", "Brewing", "Error" ], forms: [ { href: "http://127.0.0.1:8090/Virtual-Coffee-Machine/properties/state", contenttype: "application/json", op: [ "readproperty", "writeproperty" ] } ], writable: true, observable: false }, waterStatus: { type: "integer", readOnly: true, unit: "%", maximum: 100, minimum: 0, forms: [ { href: "http://127.0.0.1:8090/Virtual-Coffee-Machine/properties/waterStatus", contenttype: "application/json", op: [ "readproperty", "writeproperty" ] } ], writable: false, observable: false }, coffeeStatus: { type: "integer", readOnly: true, unit: "%", maximum: 100, minimum: 0, forms: [ { href: "http://127.0.0.1:8090/Virtual-Coffee-Machine/properties/coffeeStatus", contenttype: "application/json", op: [ "readproperty", "writeproperty" ] } ], writable: false, observable: false }, binStatus: { type: "integer", readOnly: true, unit: "%", maximum: 100, minimum: 0, forms: [ { href: "http://127.0.0.1:8090/Virtual-Coffee-Machine/properties/binStatus", contenttype: "application/json", op: [ "readproperty", "writeproperty" ] } ], writable: false, observable: false } }, actions: { brew: { input: { type: "string", enum: [ "latte-machiato", "espresso", "cappuccino" ] }, forms: [ { href: "http://127.0.0.1:8090/Virtual-Coffee-Machine/actions/brew", contenttype: "application/json", op: "invokeaction" } ] }, abort: { forms: [ { href: "http://127.0.0.1:8090/Virtual-Coffee-Machine/actions/abort", contenttype: "application/json", op: "invokeaction" } ] }, shutdown: { forms: [ { href: "http://127.0.0.1:8090/Virtual-Coffee-Machine/actions/shutdown", contenttype: "application/json", op: "invokeaction" } ] } }, events: { maintenance: { data: { type: "string" }, forms: [ { href: "http://127.0.0.1:8090/Virtual-Coffee-Machine/events/maintenance", contenttype: "application/json", subprotocol: "longpoll", op: "subscribeevent" } ] }, error: { data: { type: "string" }, forms: [ { href: "http://127.0.0.1:8090/Virtual-Coffee-Machine/events/error", contenttype: "application/json", subprotocol: "longpoll", op: "subscribeevent" } ] } } }
let td = JSON.stringify(jsontd);

let servient = new Servient();
let httpServer = new HttpServer(8080);
servient.addServer(httpServer);
servient.addClientFactory(new HttpClientFactory());

function customWaterStatReadHandler(lastValue: any, timestamp: Date) {
    return new Promise<DTCustomResponse>((resolve, reject) => { 
        if (lastValue === null || timestamp === null) { resolve({data: 0, accuracy: 0}); }
        
        let newValue = {
            data: 0,
            accuracy: 0
        }
        // for example: every 2 sec between actualtime/timestamp : reduce status by 1%, accuracy by 5pts
        let dateDelta = Date.now() - timestamp.valueOf();
        let valueDelta = Math.floor(dateDelta / 2000);
        let accuracy = 255 - Math.floor((dateDelta / 2000)) * 5;

        (lastValue - valueDelta) < 0 ? newValue.data = 0 : newValue.data = lastValue - valueDelta;
        accuracy < 0 ? newValue.accuracy = 0 : newValue.accuracy = accuracy;

        resolve(newValue); 
    })
}

servient.start().then( 
    (factory) => {
        let digitalTwin = new DigitalTwin(td, factory) 
        digitalTwin.addCustomPropertyReadHandler("waterStatus", customWaterStatReadHandler);
        digitalTwin.expose()
})
