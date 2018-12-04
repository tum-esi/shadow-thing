// TODO: This functionality should be merged in the normal cli

import { DigitalTwin } from "./digital-twin";
import { Servient } from "@node-wot/core";
import { HttpServer, HttpClientFactory } from "@node-wot/binding-http";

var td = `
{"@context":"http://www.w3.org/ns/td","@type":"Thing","id":"de:tum:ei:esi:fp:coffee","name":"Virtual-Coffee-Machine","description":"A virtual coffee machine to learn the WoT TD standard","security":[{"scheme":"nosec"}],"properties":{"state":{"type":"string","readOnly":false,"enum":["Ready","Brewing","Error"],"forms":[{"href":"http://127.0.0.1:8090/Virtual-Coffee-Machine/properties/state","contenttype":"application/json","op":["readproperty","writeproperty"]}],"writable":true,"observable":false},"waterStatus":{"type":"integer","readOnly":true,"unit":"%","maximum":100,"minimum":0,"forms":[{"href":"http://127.0.0.1:8090/Virtual-Coffee-Machine/properties/waterStatus","contenttype":"application/json","op":["readproperty","writeproperty"]}],"writable":false,"observable":false},"coffeeStatus":{"type":"integer","readOnly":true,"unit":"%","maximum":100,"minimum":0,"forms":[{"href":"http://127.0.0.1:8090/Virtual-Coffee-Machine/properties/coffeeStatus","contenttype":"application/json","op":["readproperty","writeproperty"]}],"writable":false,"observable":false},"binStatus":{"type":"integer","readOnly":true,"unit":"%","maximum":100,"minimum":0,"forms":[{"href":"http://127.0.0.1:8090/Virtual-Coffee-Machine/properties/binStatus","contenttype":"application/json","op":["readproperty","writeproperty"]}],"writable":false,"observable":false}},"actions":{"brew":{"input":{"type":"string","enum":["latte-machiato","espresso","cappuccino"]},"forms":[{"href":"http://127.0.0.1:8090/Virtual-Coffee-Machine/actions/brew","contenttype":"application/json","op":"invokeaction"}]},"abort":{"forms":[{"href":"http://127.0.0.1:8090/Virtual-Coffee-Machine/actions/abort","contenttype":"application/json","op":"invokeaction"}]},"shutdown":{"forms":[{"href":"http://127.0.0.1:8090/Virtual-Coffee-Machine/actions/shutdown","contenttype":"application/json","op":"invokeaction"}]}},"events":{"maintenance":{"data":{"type":"string"},"forms":[{"href":"http://127.0.0.1:8090/Virtual-Coffee-Machine/events/maintenance","contenttype":"application/json","subprotocol":"longpoll","op":"subscribeevent"}]},"error":{"data":{"type":"string"},"forms":[{"href":"http://127.0.0.1:8090/Virtual-Coffee-Machine/events/error","contenttype":"application/json","subprotocol":"longpoll","op":"subscribeevent"}]}}}
`;

let servient = new Servient();
let httpServer = new HttpServer(8080);
servient.addServer(httpServer);
servient.addClientFactory(new HttpClientFactory());

servient.start().then( 
    (factory) => {
        new DigitalTwin(td, factory);
})
