import {
    ComponentFactory,
    ComponentType,
    ComponentOwner,
    ComponentMap,
    Behavior,
    Process,
    Trigger,
    WriteOp,
    Data,
    IInteractionAffordance,
    u
} from "../index";


export enum RuntimeEvent {
    invokeAction = "invokeAction",
    subscribeEvent = "subscribeEvent",
    unsubscribeEvent = "unsubscribeEvent",    
    readProperty = "readProperty",
    writeProperty = "writeProperty",
    emitEvent = "emitEvent",
    startup = "startup",
    shutdown = "shutdown"
}

/** Base class for interfaction affordances. */
export abstract class InteractionAffordance extends Behavior {
    
    //#region Child components
    protected uriVariables: ComponentMap = undefined;
    //#endregion

    protected listeningProcesses: Map<RuntimeEvent, Process[]> = new Map();
    protected listeningTriggers: Map<RuntimeEvent, Trigger[]> = new Map();

    public constructor(name: string, parent: ComponentOwner, jsonObj: IInteractionAffordance){                
        super(name, parent, jsonObj);

        if(jsonObj.uriVariables){
            this.uriVariables = ComponentFactory.createComponentMap(ComponentType.UriVariable,
                "uriVariables", this, jsonObj.uriVariables);
        }            
    }

    /**
     * Parses uri variables passed by the respective
     * interaction handler of the ExposedThing.
     * 
     * @param options Valid options passed by the respective handler of the ExposedThing.
     * Each entry in the options.uriVariables must comply with the respective
     * schema specified in the ThingDescription. If there is no schema
     * specified for the entry, then the entry is ignoder. Else if the value of the
     * entry is undefined, then a default value according to the schema will be used.
     */
    protected parseUriVariables(options?: WoT.InteractionOptions){
        if(this.uriVariables){   
            for (let key of this.uriVariables.getKeys()){
                var uriVar = this.uriVariables.getChildComponent(key) as Data;

                uriVar.reset();

                if(options && options.uriVariables
                    && options.uriVariables[key] !== undefined){

                    try{
                        uriVar.write(WriteOp.copy, options.uriVariables[key]);
                    }catch(err){
                        u.fatal("Could not parse uri variable \"" + key + "\":\n" + err.message);
                    }                    
                }                                
            }
        }
    }

    /**
     * Registers a process that should be invoked when the given interaction event
     * is fired in this interaction affordance.
     * 
     * @param interactionEvent The interaction event. Valid values depending
     * on the type of interaction affordance are:
     * - readProperty
     * - writeProperty
     * - invokeAction
     * - subscribeEvent
     * - unsubscribeEvent
     * - emitEvent
     * @param process The process to register.
     */
    public registerProcess(interactionEvent: RuntimeEvent, process: Process){
        if(!this.listeningProcesses.has(interactionEvent)){
            this.listeningProcesses.set(interactionEvent, []);
        }
        if(!this.listeningProcesses.get(interactionEvent).includes(process)){
            this.listeningProcesses.get(interactionEvent).push(process)
        }        
    }

    /**
     * Registers a trigger that should be invoked when the given interaction event
     * is fired in this interaction affordance.
     * 
     * @param interactionEvent The interaction event. Valid values depending
     * on the type of interaction affordance are:
     * - readProperty
     * - writeProperty
     * - invokeAction
     * - subscribeEvent
     * - unsubscribeEvent
     * - emitEvent
     * @param trigger The trigger to register.
     */
    public registerTrigger(interactionEvent: RuntimeEvent, trigger: Trigger){
        if(!this.listeningTriggers.has(interactionEvent)){
            this.listeningTriggers.set(interactionEvent, []);
        }
        if(!this.listeningTriggers.get(interactionEvent).includes(trigger)){
            this.listeningTriggers.get(interactionEvent).push(trigger)
        }        
    }

    /**
     * Invokes the processes and the triggers that are registered to be invoked when
     * the given interaction event is fired.
     * 
     * @param interactionEvent The interaction event that was fired.
     */
    protected async onInteractionEvent(interactionEvent: RuntimeEvent){
        try{
            if(this.listeningProcesses){
                let processes = this.listeningProcesses.get(interactionEvent);
                if(processes){
                    for (const process of processes){
                        await process.invoke();
                    }
                }
            }        
    
            if(this.listeningTriggers){
                let triggers = this.listeningTriggers.get(interactionEvent);
                if(triggers){
                    for (const trigger of triggers){
                        await trigger.invoke();
                    }
                }
            }  
        }catch(err){
            throw err;
        }              
    }
}
