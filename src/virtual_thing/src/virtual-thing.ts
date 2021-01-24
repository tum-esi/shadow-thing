import {
    ComponentFactory,
    ComponentType,
    VirtualThingModel,
    IVirtualThingDescription,
    ModelStateListener,
    u,
} from "./index";

import { readFileSync } from "fs";
import { join } from "path";

const Ajv = require('ajv');


const TD_VALID_SCH = join(__dirname, '..', '..', '..', 'validation-schemas', 'td-json-schema-validation.json');
const VTD_VALID_SCH = join(__dirname, '..', '..', '..', 'validation-schemas', 'vtd-json-schema-validation.json');

var tdSchema = JSON.parse(readFileSync(TD_VALID_SCH, "utf-8"));
var vtdSchema = JSON.parse(readFileSync(VTD_VALID_SCH, "utf-8"));

var ajv = new Ajv();
ajv.addSchema(tdSchema, 'td');
ajv.addSchema(vtdSchema, 'vtd');

/** Class representing a Virtual Thing instance. */
export class VirtualThing implements ModelStateListener {

    private vtd: IVirtualThingDescription = undefined;
    private td: WoT.ThingDescription = undefined;
    private factory: WoT.WoT = undefined;
    private thing: WoT.ExposedThing = undefined;
    private model: VirtualThingModel = undefined;
    
    /**
     * Create a virtual thing
     * @param vtd An object representing a valid Virtual Thing Description.
     * @param factory A WoTFactory attached to the node WoT
     * servient where the thing should be exposed.
     */
    public constructor(vtd: IVirtualThingDescription, factory: WoT.WoT, config?: VirtualThingConfig) {

        this.factory = factory;
        this.vtd = vtd;

        try{            
            u.addEventEmitterProcessesWorkaround(this.vtd, config);
            
            u.resolveSchemaReferences(this.vtd);
            
            /*
            TODO decide whether validation of TD should happen here.
            If yes, then the TD must be complete at this point, i.e. can't be jsut a Thing Model.
            Currently, validation is in this.expose()

            if(!ajv.validate('td', vtd)){
                u.fatal("Invalid TD specified: " + ajv.errorsText());
            }*/
            
            if(!ajv.validate('vtd', vtd)){
                u.fatal("Invalid VTD specified: " + ajv.errorsText());
            }
            
            this.model = ComponentFactory.createComponent(ComponentType.Model, 
                    this.getName(), undefined, this.vtd) as VirtualThingModel;

            this.model.addModelStateListener(this);        
            this.td = u.extractTD(this.vtd);              
        }catch(err){
            u.fatal("Create model failed:\n" + err.message, this.getName());
        }
    }

    public onModelFailed(message: string) {
        u.error("Model failed:\n" + message, this.getName());
    }
    
    public onModelStartIssued() {
        u.info("Model start issued.", this.getName());
    }

    public onModelStopIssued() {
        u.info("Model stop issued.", this.getName());

        // TODO adapt this when "destroy" is implemented in node-wot
        this.thing.destroy()
            //.then(() => u.info("Exposed thing destroyed.", this.getName()))
            .catch(err => u.error(err.message, this.getName()));
    }

    public getModel(): VirtualThingModel {
        return this.model;
    }

    public getName(): string {
        return this.vtd.title;
    }

    public async produce() {
        if(!this.thing){
            try{
                this.thing = await this.factory.produce(this.td);
                this.model.bindToThing(this.thing);
                this.model.start();
            }catch(err){
                throw err;
            }  
        }
        return this;         
    }

    public expose() {
        this.thing.expose()
            .then(() => {

                /**
                 * TODO
                 * 
                 * Validation at this point is a trick to enable usage of
                 * incomplete TDs (Thing Model) yet having an opportunity to
                 * validate them by the default TD validation schema.
                 * The trick is that when the thing is exposed,
                 * the missing mandatory properties such as forms, etc.
                 * will be generated using defaults.
                 */
                if(!ajv.validate('td', this.thing.getThingDescription())){
                    u.fatal("Invalid TD specified: " + ajv.errorsText());
                }
            })
            .catch(err => u.error(err.message, this.getName()));
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