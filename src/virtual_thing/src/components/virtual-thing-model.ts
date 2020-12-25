import {
    IVirtualThingDescription,
    ComponentFactory,
    Component,
    ComponentOwner,
    ComponentType,
    ComponentMap,
    Interval,
    Pointer,
    Trigger,
    Process,
    Property,
    Action,
    u
} from "../index";

const Servient = require('@node-wot/core').Servient;
const Helpers = require('@node-wot/core').Helpers;
const HttpClientFactory = require('@node-wot/binding-http').HttpClientFactory;

const Ajv = require('ajv');

export interface ModelStateListener {
    onModelFailed(message: string): void;
    onModelStartIssued(): void;
    onModelStopIssued(): void;
}

/**
 * Class that represents the root object in the Virtual Thing Description.
 * The core structure of a valid Virtual Thing Model is a tree with
 * nodes being instances of 'VTMNode' and the root node being specifically
 * an instance of 'VirtualThingModel'.
 */
export class VirtualThingModel extends ComponentOwner {

    private stopIssued: boolean = false;

    private ajv = new Ajv();

    private exposedThing: WoT.ExposedThing = undefined;
    private consumedThings: Map<string, WoT.ConsumedThing> = new Map();

    private stateListeners: ModelStateListener[] = [];
    private pointers: Pointer[] = [];
    private periodicTriggerIntervals: Interval[] = [];    
    private onStartupTriggers: Trigger[] = [];   
    private onShutdownTriggers: Trigger[] = [];
    private registeredProcesses: Process[] = [];    
    private registeredTriggers: Trigger[] = [];
        
    //#region Properties that are the child nodes of this node
    private properties: ComponentMap = undefined;
    private actions: ComponentMap = undefined;
    private events: ComponentMap = undefined;
    private sensors: ComponentMap = undefined;
    private actuators: ComponentMap = undefined;
    private dataMap: ComponentMap = undefined;
    private processes: ComponentMap = undefined;
    //#endregion

    public constructor(name: string, jsonObj: IVirtualThingDescription) {

        super(name, undefined);

        if(jsonObj.properties){
            this.properties = ComponentFactory.createComponentMap(ComponentType.Property, "properties", this, jsonObj.properties);
        }
        if(jsonObj.actions){
            this.actions = ComponentFactory.createComponentMap(ComponentType.Action, "actions", this, jsonObj.actions);
        }
        if(jsonObj.events){
            this.events = ComponentFactory.createComponentMap(ComponentType.Event, "events", this, jsonObj.events);
        }
        if(jsonObj.sensors){
            this.sensors = ComponentFactory.createComponentMap(ComponentType.Sensor, "sensors", this, jsonObj.sensors);
        }
        if(jsonObj.actuators){
            this.actuators = ComponentFactory.createComponentMap(ComponentType.Actuator, "actuators", this, jsonObj.actuators);
        }
        if(jsonObj.dataMap){
            this.dataMap = ComponentFactory.createComponentMap(ComponentType.Data, "dataMap", this, jsonObj.dataMap);
        }
        if(jsonObj.processes){
            this.processes = ComponentFactory.createComponentMap(ComponentType.Process, "processes", this, jsonObj.processes);
        }
    }
    
    /**
     * Binds interaction affordances of the given ExposedThing with
     * their respective handlers in the Virtual Thing Model.
     * 
     * Throws an error in case of a failure.
     * 
     * @param thing A valid ExposedThing thing object created from the
     * same Virtual Thing Description as this Virtual Thing Model.
     */
    public bindToThing(thing: WoT.ExposedThing){

        this.exposedThing = thing;
        
        try{

            // bind property handlers
            for (let propName in thing.getThingDescription().properties) {
                const property = this.properties.getChildComponent(propName) as Property;
                if (thing.getThingDescription().properties[propName].writeOnly !== true) {
                    thing.setPropertyReadHandler(propName, 
                        (options?) => property.onRead(options));
                }
                if (thing.getThingDescription().properties[propName].readOnly !== true) { 
                    thing.setPropertyWriteHandler(propName, 
                        (value, options?) => property.onWrite(value, options));
                }
            }

            // bind action handlers
            for (let actionName in thing.getThingDescription().actions) {
                const action = this.actions.getChildComponent(actionName) as Action;
                thing.setActionHandler(actionName,
                    (params, options?) => action.onInvoke(params, options));
            }

            /*
            TODO uncomment this in case something like 'setSubscribeEventHandler()' and 
            'setUnsubscribeEventHandler()' is implemented in WoT Exposed Thing.
            Change the function names if necessary.
            // bind event handlers
            for (let eventName in thing.getThingDescription().events) {
                const event = this.events.getChildComponent(eventName) as Event;
                thing.setSubscribeEventHandler(eventName,
                    (params, options?) => event.onSubscribe(params, options));
                thing.setUnsubscribeEventHandler(eventName,
                    (params, options?) => event.onUnsubscribe(params, options));
            }
            */
        }catch(err){
            u.fatal("Failed to bind Thing:\n" + err.message, this.getFullPath());
        }
    }

    public getExposedThing(): WoT.ExposedThing {
        return this.exposedThing;
    }

    public getChildComponent(type: ComponentType): Component {
        let component = undefined;
        switch(type){
            case ComponentType.Property:
                component = this.properties;
                break;
            case ComponentType.Action:
                component = this.actions;
                break;
            case ComponentType.Event:
                component = this.events;
                break;
            case ComponentType.Sensor:
                component = this.sensors;
                break;
            case ComponentType.Actuator:
                component = this.actuators;
                break;
            case ComponentType.Process:
                component = this.processes;
                break;
            case ComponentType.Data:
                component = this.dataMap;
                break;
        }
        if(component == undefined){
            this.errChildDoesNotExist(type);
        }
        return component;
    }

    /**
     * Adds a listener that should be notified on model state change.
     * 
     * @param listener A valid 'ModelStateListener' instance.
     */
    public addModelStateListener(listener: ModelStateListener){
        if(!this.stateListeners.includes(listener)){
            this.stateListeners.push(listener);
        }
    }

    public getValidator(){
        return this.ajv;
    }

    /**
     * Adds a trigger that should be invoked on model start.
     * 
     * @param trigger A valid 'Trigger' instance.
     */
    public addOnStartupTrigger(trigger: Trigger){
        if(!this.onStartupTriggers.includes(trigger)){
            this.onStartupTriggers.push(trigger);
        }
    }

    /**
     * Adds a trigger that should be invoked on model stop.
     * 
     * @param trigger A valid 'Trigger' instance.
     */
    public addOnShutdownTrigger(trigger: Trigger){
        if(!this.onShutdownTriggers.includes(trigger)){
            this.onShutdownTriggers.push(trigger);
        }
    }

    /**
     * Adds a trigger to the list of triggers.
     * Each trigger should be registered in the model
     * so that the model can setup the trigger on model start.
     * 
     * @param trigger A valid 'Trigger' instance.
     */
    public registerTrigger(trigger: Trigger){
        if(!this.registeredTriggers.includes(trigger)){
            this.registeredTriggers.push(trigger);
        }
    }

    /**
     * Adds a process to the list of processes.
     * Each process should be registered in the model
     * so that the model can setup the process on model start.
     * 
     * @param process A valid 'Process' instance.
     */
    public registerProcess(process: Process){
        if(!this.registeredProcesses.includes(process)){
            this.registeredProcesses.push(process);
        }
    }

    /**
     * Adds an interval to the list of periodic intervals.
     * These intervals are started on model start and stopped
     * on model stop.
     * 
     * @param interval A valid 'Interval' instance.
     */
    public registerPeriodicInterval(interval: Interval){
        if(!this.periodicTriggerIntervals.includes(interval)){
            this.periodicTriggerIntervals.push(interval);
        }
    }

    /**
     * Adds a pointer to the list of pointers.
     * These pointers will be initialized on model start.
     * 
     * @param pointer A valid 'Pointer' instance.
     */
    public registerPointer(pointer: Pointer){
        if(!this.pointers.includes(pointer)){
            this.pointers.push(pointer);
        }
    }

    /** Performs startup routines of the model and notifies the listeners. */
    public async start(){    
        this.reportFunctionCall("start()");
        this.stopIssued = false;    
        try{
            for(let listener of this.stateListeners){
                listener.onModelStartIssued();
            }
            for(const pointer of this.pointers){
                pointer.init();
            }
            for(let process of this.registeredProcesses){
                process.setup();
            }  
            for(let trigger of this.registeredTriggers){
                trigger.setup();
            }
            for(let trigger of this.onStartupTriggers){
                trigger.invoke();
            }
            for(let interval of this.periodicTriggerIntervals){
                interval.start();
            }
        }catch(err){
            u.modelFailure(err.message, this);
        }
    }

    /** Performs shutdown routines of the model and notifies the listeners. */
    public async stop(){
        this.reportFunctionCall("stop()");
        if(this.stopIssued){
            return;
        }

        this.stopIssued = true;
        try{ 
            for(let listener of this.stateListeners){
                listener.onModelStopIssued();
            } 
            for(let interval of this.periodicTriggerIntervals){
                interval.stop();
            }
            for(let trigger of this.onShutdownTriggers){
                await trigger.invoke();
            }
            for(let proc of this.registeredProcesses){
                proc.abort();
            }           
        }catch(err){
            u.error(err.message, this.getFullPath());
        }       
    }

    /** Notifies listeners about failure and issues model stop. */
    public failure(reason: string){
        this.reportFunctionCall("failure()");
        for(let listener of this.stateListeners){
            listener.onModelFailed(reason);
        }
        this.stop();
    } 

    /**
     * Returns a ConsumedThing that has the given uri.
     * If the ConsumedThing is consumed for the first time,
     * it will be stored for future references.  
     * 
     * Throws and error in case of a failure.
     * 
     * @param uri A valid Http-based uri to consume a thing.
     * 
     * // TODO implement further protocols to consume things
     */
    public async getConsumedThing(uri: string): Promise<WoT.ConsumedThing> {
        if(!this.consumedThings.has(uri)){
            try{
                let servient = new Servient();                
                servient.addClientFactory(new HttpClientFactory(null));
                let wotHelper = new Helpers(servient);
    
                let TD = await wotHelper.fetch(uri);
                let WoT = await servient.start();                
                let consumedThing = await WoT.consume(TD);

                this.consumedThings.set(uri, consumedThing);
            }catch(err){
                u.fatal("Failed to consume thing: " + uri, this.getRelativePath());
            }
        }
        return this.consumedThings.get(uri);
    }
}