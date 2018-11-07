import * as WoT from "wot-typescript-definitions";
import { Servient, Helpers } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";
import { HttpClientFactory } from "@node-wot/binding-http";
import { HttpsClientFactory } from "@node-wot/binding-http";

export default class virtualServient extends Servient {
    public readonly config: any;

    public constructor(config: any) {
        super();

        // init config
        this.config = config;

        // display
        console.info("DefaultServient configured with");
        console.dir(this.config);

        // apply config
        if (typeof this.config.servient.staticAddress === "string") {
            Helpers.setStaticAddress(this.config.servient.staticAddress);
        }

        if (this.config.http !== undefined) {
            let httpServer = (typeof this.config.http.port === "number") ? new HttpServer(this.config.http.port) : new HttpServer();
            this.addServer(httpServer);
        }

        this.addClientFactory(new HttpClientFactory(this.config.http));
        this.addClientFactory(new HttpsClientFactory(this.config.http));
    }
}