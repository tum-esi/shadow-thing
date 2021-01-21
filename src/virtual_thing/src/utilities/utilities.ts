import {
    VTMNode,
    IVirtualThingDescription,
    VirtualThingConfig,
    IBehavior,
    IDataMap,
    IDataSchema
} from "../index";


export enum ConsoleMessageType {
    log = "VT_LOG",
    info = "VT_INFO",
    warn = "VT_WARN",
    debug = "VT_DEBUG",
    error = "VT_ERROR"
}

/** Class with static utility functions */
export class Utilities {

    //#region Data and types

    public static copy(value: any){
        if(value === undefined){
            return undefined;
        }else{
            return JSON.parse(JSON.stringify(value));
        }
    }

    public static equalAsStr(val1: any, val2: any){
        return JSON.stringify(val1) == JSON.stringify(val2);
    }

    public static instanceOf(value: any, type: any): boolean {
        switch(type){
            case null:
            case Boolean:
            case Number:
            case String:
            case Object:
                if(typeof value == this.getTypeNameFromType(type)){
                    return true;
                }
                break;
            case Array:
                if(Array.isArray(value)){
                    return true;
                }
                break;
            default:
                if(typeof type == "function" && value instanceof type){
                    return true;
                }
                break;
        }
        return false;
    }
    
    public static getTypeNameFromType(type: any){
        switch(type){
            case Boolean:
                return "boolean";
            case Number:
                return "number";
            case String:
                return "string";
            case Array:
                return "array";
            case null:
            case Object:
                return "object";
            case Array:
                return "array";
            default:
                if(typeof type == "function"){
                    return type.name;
                }else{
                    return "unknown";
                }
        }
    }
    
    public static getTypeNameFromValue(value: any){
        if(typeof value == "object"){
            return value.constructor.name;
        }else{
            return typeof value;
        }
    }

    //#endregion
    
    //#region Console messages

    /**
     * Returns a formatted console message
     * 
     * @param messageType 
     * @param message 
     * @param source 
     */
    public static makeVTMessage(messageType: ConsoleMessageType,
                                        message: string,
                                        source: string,
                                        multiline: boolean = false): string {                                            
        return (messageType ? messageType + ": " : "")
            + (source ? source + ":" : "")
            + (message ? (source ? (multiline ? "\n" : " ") : "") + message : "");
    }

    /**
     * Issues failure on the VirtualThingModel instance
     * of the given 'source' node.
     * 
     * @param reason A message indicating the reason of the failure.
     * @param source An instance of VTMNode that issues failure.
     */
    public static modelFailure(reason: string, source: VTMNode){
        source.getModel().failure(this.makeVTMessage(undefined, reason, source.getFullPath(), true));        
    }
    
    /** Throws an Error */ 
    public static fatal(message: string, source: string = undefined){
        throw new Error(this.makeVTMessage(undefined, message, source, true));
    }
    
    public static info(message: string, source: string = undefined, withType: boolean = true): string {
        let mes = this.makeVTMessage(withType ? ConsoleMessageType.info: undefined, message, source);
        console.info(mes);
        return mes;
    }
    
    public static debug(message: string, source: string = undefined, withType: boolean = true): string {
        let mes = this.makeVTMessage(withType ? ConsoleMessageType.debug: undefined, message, source);
        console.debug(mes);
        return mes;
    }
    
    public static warn(message: string, source: string = undefined, withType: boolean = true): string {
        let mes = this.makeVTMessage(withType ? ConsoleMessageType.warn: undefined, message, source);
        console.warn(mes);
        return mes;
    }
    
    /** Does not throw error, only prints in console. */
    public static error(message: string, source: string = undefined, withType: boolean = true): string {
        let mes = this.makeVTMessage(withType ? ConsoleMessageType.error: undefined, message, source, true);
        console.error(mes);
        return mes;
    }
    
    public static log(message: string, source: string = undefined, withType: boolean = true): string {
        let mes = this.makeVTMessage(withType ? ConsoleMessageType.log: undefined, message, source);
        console.log(mes);
        return mes;
    }

    //#endregion

    //#region Virtual Thing Description

    /**
     * Resolve the 'schema' property in the following 'DataSchema' instances in the given
     * Virtual Thing Description (vtd) object:
     * - all entries in 'vtd.properties'
     * - 'input', 'output' of all entries in 'vtd.actions'
     * - 'data', 'subscription', 'cancellation' of all entries in 'vtd.events'
     * - all entries in all 'dataMap' instances
     * - all entries in all 'uriVariables' instances
     * 
     * @param vtd An object representing a valid Virtual Thing Description
     */
    public static resolveSchemaReferences(vtd: IVirtualThingDescription){
       
        if(!vtd.dataSchemas){
            return;
        }
    
        /**
         * In the 'given dataSchema object', replace the 'schema' property by the properties of the
         * respective object from the 'vtd.dataSchemas'. DO NOT OVERWRITE existing properties
         * in the 'given dataSchema object'.
         * @param dataSchema The 'given dataSchema object'
         */
        let resolveDataSchema = function(dataSchema: IDataSchema){
            if(dataSchema && dataSchema.schema){
                let schemaObj = vtd.dataSchemas[dataSchema.schema];
                if(!schemaObj){
                    Utilities.fatal("No data schema \"" + dataSchema.schema + "\" is defined.", vtd.title);
                }
                for (let key in schemaObj){
                    if(!(key in dataSchema)){
                        dataSchema[key] = Utilities.copy(schemaObj[key]);
                    }
                }
                delete dataSchema.schema;
            }
        }
    
        let resolveDataMap = function(dataMap: IDataMap){
            if(dataMap){
                for (let key in dataMap){
                    resolveDataSchema(dataMap[key]);
                }
            }
        }

        let resolveBehavior = function(behavior: IBehavior){
            if(behavior){
                resolveDataMap(behavior.dataMap);
                if(behavior.processes){
                    for (let key in behavior.processes){
                        resolveDataMap(behavior.processes[key].dataMap);
                    }
                }
            }        
        }

        resolveBehavior(vtd);
        if(vtd.properties){
            for (let key in vtd.properties){
                resolveBehavior(vtd.properties[key]);
                resolveDataMap(vtd.properties[key].uriVariables);
                resolveDataSchema(vtd.properties[key] as IDataSchema);
            }
        }     
        if(vtd.actions){
            for (let key in vtd.actions){
                resolveBehavior(vtd.actions[key]);
                resolveDataMap(vtd.actions[key].uriVariables);
                resolveDataSchema(vtd.actions[key].input);
                resolveDataSchema(vtd.actions[key].output);
            }
        }     
        if(vtd.events){
            for (let key in vtd.events){
                resolveBehavior(vtd.events[key]);
                resolveDataMap(vtd.events[key].uriVariables);
                resolveDataSchema(vtd.events[key].data);
                resolveDataSchema(vtd.events[key].subscription);
                resolveDataSchema(vtd.events[key].cancellation);
            }
        }     
        if(vtd.sensors){
            for (let key in vtd.sensors){
                resolveBehavior(vtd.sensors[key]);
            }
        }     
        if(vtd.actuators){
            for (let key in vtd.actuators){
                resolveBehavior(vtd.actuators[key]);
            }
        }
    }

    /*
     * TODO this function deletes properties from VTD to make a usual TD. In the future,
     * some of the properties deleted here may be included into the vocabulary of a usual TD.
     * Revisit this function if that happens.
     */
    /**
     * Extracts a WoT Thing Description object from a Virtual Thing Description object
     * by taking a copy of the latter and removing all Virtual Thing-specific properties from it.  
     * 
     * @param vtd An object representing a valid Virtual Thing Description
     */
    public static extractTD(vtd: IVirtualThingDescription): WoT.ThingDescription {

        let clearDataSchema = function(dataSchema: IDataSchema){
            if(dataSchema){
                delete dataSchema.fake;
                delete dataSchema.schema;
            }
        }

        let clearBehavior = function(behavior: IBehavior){
            delete behavior.dataMap;
            delete behavior.processes;
        }

        let td: IVirtualThingDescription = this.copy(vtd);

        clearBehavior(td);

        if(td.properties){
            for (let key in td.properties){
                clearBehavior(td.properties[key]);
                clearDataSchema(td.properties[key]);
            }
        }
        if(td.actions){
            for (let key in td.actions){
                clearBehavior(td.actions[key]);
                clearDataSchema(td.actions[key].input);
                clearDataSchema(td.actions[key].output);
            }
        }
        if(td.events){
            for (let key in td.events){
                clearBehavior(td.events[key]);
                clearDataSchema(td.events[key].data);
                clearDataSchema(td.events[key].subscription);
                clearDataSchema(td.events[key].cancellation);
            }
        }        
        delete td.sensors;
        delete td.actuators;
        delete td.dataSchemas;

        return td;
    }

    /**
     * // TODO
     * 
     * This function is a temporary workaround to make use of the VirtualThingConfig concept inherited
     * from previous VirtualThing simulator. With the new VirtualThing, Events are emitted using
     * the 'EmitEvent' class, which is an 'Insruction', and hence, must be executed within a 'Process' instance.
     * This implies that in order to emit an Event, one needs to have such an instruction defined in the
     * Virtual Thing Description (VTD).  
     * 
     * In VirtualThing, there is no special functionality that would serve solely the purpose of emitting Events
     * based on VirtualThingConfig. The reason is the following:  
     * In the future, it would be good to have some sort of reusable Processes mechanism, such that adding 
     * e.g. a generic "EventEmitter" Process would not require much efforts, e.g. "$ref": "path/to/EventEmitter.json"
     * (see documentation/specification/FurtherWork.md).
     * When such a mechanism is implemented, this function as well as all the references of VirtualThingConfig
     * in the scope of VirtualThing will become obsolete.
     * 
     * 
     * This function simply adds missing entries into the VTD to create a
     * Process that would emit the Event with the given interval
     * for each Event that is present in the provided VirtualThingConfig. This will have the same
     * effect as if the user would define such a Process in the VTD. This, however, does not prevent
     * the user from defining such a Process in the VTD manually.  
     * 
     * @param vtd 
     * @param config 
     */
    public static addEventEmitterProcessesWorkaround(vtd: IVirtualThingDescription, config?: VirtualThingConfig){
        if(!config){
            return;
        }

        for(let key in config.eventIntervals){
            let event = vtd.events[key] as IBehavior;
            if(event){
                if(!event.processes){
                    event.processes = {};
                }
                event.processes.procEmitEvent_86e4aab846e411ebb3780242ac130002 = {
                    triggers: [ { interval: "" + (config.eventIntervals[key] * 1000) } ],
                    instructions: [ { emitEvent: { pointer: ".." } } ]
                }
            }
        }
    }
    //#endregion
}