import {
    VTMNode,
    Interval,
    Math,
    Pointer,
    ComponentType,
    InteractionAffordance,
    RuntimeEvent,
    ITrigger,
    u
} from "../index";


/** Class that represents entries of the 'triggers' array in Virtual Thing Description. */
export class Trigger extends VTMNode {
    
    private runtimeEvent: RuntimeEvent = undefined;
    private interactionAffordanceName: string = undefined;
    private interval: Interval = undefined;
    private condition: Math = undefined;
    private wait: boolean = true;
    
    public constructor(name: string, parent: VTMNode, jsonObj: ITrigger){
        super(name, parent);
        
        if(jsonObj.interval){
            this.interval = new Interval("interval", this, jsonObj.interval, true);
        }else{
            this.runtimeEvent = jsonObj.runtimeEvent;
            this.interactionAffordanceName = jsonObj.interactionAffordance;
        }
        if(jsonObj.condition){
            this.condition = new Math("condition", this, jsonObj.condition);
        }
        if(jsonObj.wait != undefined){
            this.wait = jsonObj.wait;
        }
        this.getModel().registerTrigger(this);           
    }

    /**
     * Setup the trigger. Should be called before starting the Model, but
     * after all the interaction affordance instances are created.  
     * Throws an error if setup fails due to invalid parameters of the trigger.
     */
    public setup(){

        if(this.interval){

            /**
             * If the trigger is invoked by an interval object,
             * simply register the trigger by that interval.
             */
            this.interval.setTrigger(this);

        }else{

            // Register trigger according to the specified runtime event
            
            let componentType: ComponentType = undefined;

            switch(this.runtimeEvent){
                case RuntimeEvent.readProperty:
                case RuntimeEvent.writeProperty:
                    componentType = ComponentType.Property;
                    break;
                case RuntimeEvent.invokeAction:
                    componentType = ComponentType.Action;
                    break;
                case RuntimeEvent.emitEvent:
                case RuntimeEvent.subscribeEvent:
                case RuntimeEvent.unsubscribeEvent:
                    componentType = ComponentType.Event;
                    break;
                case RuntimeEvent.startup:
                    this.getModel().addOnStartupTrigger(this);
                    return;
                case RuntimeEvent.shutdown:
                    this.getModel().addOnShutdownTrigger(this);
                    return;
                default:
                    return;
            }
            
            try{
                
                let intAffComponent = new Pointer("interactionAffordance", this,
                                                [ "/" + componentType + "/" + this.interactionAffordanceName ],
                                                [InteractionAffordance])
                                                .readValue() as InteractionAffordance;

                intAffComponent.registerTrigger(this.runtimeEvent, this);
            }catch(err){
                u.fatal(err.message, this.getFullPath())
            }
        }
    }

    /**
     * Invokes the process which owns the trigger as long
     * there is no condition specified or the condition is met.
     */
    public async invoke(){
        try{
            if(!this.condition || await this.condition.evaluate()){
                if(this.wait){
                    await this.getProcess().invoke();
                }else{
                    this.getProcess().invoke();
                }
            }
        }catch(err){
            u.modelFailure(err.message, this);
        }        
    }
}
