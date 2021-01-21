import {
    InteractionAffordance,
    ComponentFactory,
    RuntimeEvent,
    ComponentOwner,
    ComponentType,
    Data,
    Component,
    WriteOp,
    IEvent,
    u,
    ReadOp
} from "../index";


/** Class that represents an Event interfaction affordance. */
export class Event extends InteractionAffordance {

    //#region Child components
    private subscription: Data = undefined;
    private data: Data = undefined;
    private cancellation: Data = undefined;
    //#endregion

    public constructor(name: string, parent: ComponentOwner, jsonObj: IEvent){
        super(name, parent, jsonObj);

        if(jsonObj.data){
            this.data = ComponentFactory.createComponent(ComponentType.EventData,
                "data", this, jsonObj.data) as Data;
        } 
        if(jsonObj.subscription){
            this.subscription = ComponentFactory.createComponent(ComponentType.Subscription, 
                "subscription", this, jsonObj.subscription) as Data;
        } 
        if(jsonObj.cancellation){
            this.cancellation = ComponentFactory.createComponent(ComponentType.Cancellation, 
                "cancellation", this, jsonObj.cancellation) as Data;
        } 
    }

    public getChildComponent(type: ComponentType): Component {

        let component = undefined;

        switch(type){
            case ComponentType.Process:
                component = this.processes;
                break;
            case ComponentType.Data:
                component = this.dataMap;
                break;
            case ComponentType.EventData:
                component = this.data;
                break;
            case ComponentType.Subscription:
                component = this.subscription;
                break;
            case ComponentType.Cancellation:
                component = this.cancellation;
                break;
            case ComponentType.UriVariable:
                component = this.uriVariables;
                break;
        }
        if(component == undefined){
            this.errChildDoesNotExist(type);
        }
        return component;
    }
        
    /**
     * The subscribe handler for the respective event of the ExposedThing.     
     * // TODO not actually implemented in WoT
     * 
     * @param params The params passed by the ExposedThing.
     * @param options The options passed by the ExposedThing.
     */
    public async onSubscribe(params: any, options?: WoT.InteractionOptions) {
        this.reportFunctionCall("onSubscribe()");
        
        try{   
            this.parseUriVariables(options);                             
            if(this.subscription){
                this.subscription.reset();
                if(params !== undefined){
                    this.subscription.write(WriteOp.copy, params);
                }                
            }
            await this.onInteractionEvent(RuntimeEvent.subscribeEvent);
        }catch(err){
            u.error("Subscribe event failed:\n" + err.message, this.getFullPath());
        }
    }
        
    /**
     * The unsubscribe handler for the respective event of the ExposedThing.     
     * // TODO not actually implemented in WoT
     * 
     * @param params The params passed by the ExposedThing.
     * @param options The options passed by the ExposedThing.
     */
    public async onUnsubscribe(params: any, options?: WoT.InteractionOptions) {        
        this.reportFunctionCall("onUnsubscribe()");
        try{   
            this.parseUriVariables(options);                             
            if(this.cancellation){
                this.cancellation.reset();
                if(params !== undefined){
                    this.cancellation.write(WriteOp.copy, params);
                }                
            }
            await this.onInteractionEvent(RuntimeEvent.unsubscribeEvent);
        }catch(err){
            u.error("Unsubscribe event failed:\n" + err.message, this.getFullPath());
        }
    }

    /**
     * Emit the respective event of the ExposedThing.
     * 
     * @param data A valid payload for the Event.
     * If there is no payload specified for the Event in the Thing Description, then
     * this parameter will be ignored. Else if the value of this parameter is undefined,
     * then a default value according to the payload schema will be sent.
     */
    public async emit(data?: any){
        this.reportFunctionCall("emit()");
        try{
            let thing = this.getModel().getExposedThing();
            if(!thing){
                u.fatal("Thing is undefined.")
            }
            if(this.data){
                if(data !== undefined){
                    this.data.write(WriteOp.copy, data);
                }
                thing.emitEvent(this.getName(), this.data.read(ReadOp.copy));
            }else{
                thing.emitEvent(this.getName(), undefined);
            }            
            await this.onInteractionEvent(RuntimeEvent.emitEvent);
        }catch(err){
            u.fatal("Emit event failed:\n" + err.message, this.getFullPath());
        }        
    }
}