import { u } from "../index";

import { Servient, Helpers } from "@node-wot/core";
import { HttpClientFactory, HttpsClientFactory } from "@node-wot/binding-http";
import { CoapClientFactory, CoapsClientFactory } from "@node-wot/binding-coap";
import { MqttClientFactory } from "@node-wot/binding-mqtt";


export class ConsumedThings {
    
    private consumedThings: Map<string, WoT.ConsumedThing> = new Map();

    /**
     * Returns a ConsumedThing according to the given uri.
     * If the ConsumedThing is consumed for the first time,
     * it will be stored for future references.  
     * 
     * Throws and error in case of a failure.  
     * 
     * Supported protocols: http, https, coap, coaps, mqtt
     * 
     * @param uri A valid uri to consume a thing.
     * 
     * // TODO implement further protocols to consume things
     */
    public async get(uri: string): Promise<WoT.ConsumedThing> {
        if(!this.consumedThings.has(uri)){
            try{
                let servient = new Servient();                

                let protocol = new URL(uri).protocol;
                if(!protocol){
                    u.fatal("Undefined protocol.");
                    return undefined;
                }
                
                protocol = protocol.toLowerCase();
                if(protocol.startsWith("http")){
                    servient.addClientFactory(new HttpClientFactory(null));
                }else if(protocol.startsWith("https")){
                    servient.addClientFactory(new HttpsClientFactory(null));
                }else if(protocol.startsWith("coap")){
                    servient.addClientFactory(new CoapClientFactory(null));
                }else if(protocol.startsWith("coaps")){
                    servient.addClientFactory(new CoapsClientFactory(null));
                }else if(protocol.startsWith("mqtt")){
                    servient.addClientFactory(new MqttClientFactory());
                }else{
                    u.fatal("Unsupported protocol: " + protocol);
                    return undefined;                    
                }

                let wotHelper = new Helpers(servient);
    
                let TD = await wotHelper.fetch(uri);
                let WoT = await servient.start();                
                let consumedThing = await WoT.consume(TD);

                this.consumedThings.set(uri, consumedThing);
            }catch(err){
                u.fatal("Failed to consume thing: " + uri + ":\n" + err.message);
            }
        }
        return this.consumedThings.get(uri);
    }
}