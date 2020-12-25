import {
    ComponentFactory,
    ComponentOwner,
    ComponentType,
    Component,
    Trigger,
    Instructions,
    Math,
    RuntimeEvent,
    Action,
    Property,
    Event,
    IProcess,
    u,
    ComponentMap
} from "../index";


export enum ProcessState {
    idle,
    running,
    aborted
}

/** Class that represents a Process in Virtual Thing Description. */
export class Process extends ComponentOwner {

    private readonly defaultNameOnReadProperty = "read";
    private readonly defaultNameOnWritePropery = "write";
    private readonly defaultNameOnSubscribeEvent = "subscribe";
    private readonly defaultNameOnUnsubscribeEvent = "unsubscribe";

    private state: ProcessState = ProcessState.idle;

    //#region Child nodes
    private triggers: Trigger[] = [];
    private condition: Math = undefined;
    private dataMap: ComponentMap = undefined;
    private instructions: Instructions = undefined;
    //#endregion
    private wait: boolean = true;    

    public constructor(name: string, parent: ComponentOwner, jsonObj: IProcess){

        super(name, parent);
            
        if(jsonObj.triggers instanceof Array){
            let index = 0;
            jsonObj.triggers.forEach(trigObj => this.triggers.push(new Trigger("triggers/" + index++, this, trigObj)));
        }

        if(jsonObj.instructions){
            this.instructions = new Instructions("instructions", this, jsonObj.instructions);
        }
        if(jsonObj.condition){
            this.condition = new Math("condition", this, jsonObj.condition);
        }                
        if(jsonObj.dataMap){
            this.dataMap = ComponentFactory.createComponentMap(ComponentType.Data,
                "dataMap", this, jsonObj.dataMap);
        }
        if(jsonObj.wait != undefined){
            this.wait = jsonObj.wait;
        }

        this.getModel().registerProcess(this);
    }

    /**
     * Setup the process. Should be called before starting the Model, but
     * after all the instances of 'Behavior' are created.
     */
    public setup(){

        /**
         * If there are no explicit triggers specified for a process in a
         * Virtual Thing Description Model, and the process is in the
         * scope of an interaction affordance node, then the process
         * will register itself to be invoked automatically when respective
         * runtime events are fired in that interaction affordance.
         * To which runtime event the process will hook depends on the name of the process.
         */
        if(this.triggers.length == 0){

            let behavior = this.getBehavior();

            // If the process belongs to a Property interaction affordance
            if(behavior instanceof Property){

                if(this.getName() == this.defaultNameOnReadProperty){
                    behavior.registerProcess(RuntimeEvent.readProperty, this);
                }else if(this.getName() == this.defaultNameOnWritePropery){
                    behavior.registerProcess(RuntimeEvent.writeProperty, this);
                }else{
                    behavior.registerProcess(RuntimeEvent.readProperty, this);
                    behavior.registerProcess(RuntimeEvent.writeProperty, this);
                }

            // If the process belongs to an Action interaction affordance
            }else if(behavior instanceof Action){

                behavior.registerProcess(RuntimeEvent.invokeAction, this);

            // If the process belongs to an Event interaction affordance
            }else if(behavior instanceof Event){

                if(this.getName() == this.defaultNameOnSubscribeEvent){
                    behavior.registerProcess(RuntimeEvent.subscribeEvent, this);    
                }else if(this.getName() == this.defaultNameOnUnsubscribeEvent){
                    behavior.registerProcess(RuntimeEvent.unsubscribeEvent, this);    
                }else{
                    behavior.registerProcess(RuntimeEvent.emitEvent, this);
                }                
            }            
        }
    }
    
    public async invoke(){
        try{
            if(!this.condition || await this.condition.evaluate()){
                this.onStart();
                if(this.wait){
                    await this.instructions.execute();
                }else{
                    this.instructions.execute();
                }              
                this.onComplete();
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }    
    }

    /**
     * Indicates whether the process is in 'aborted' state.
     * Can be used by the instructions of the process to decide
     * whether to continue execution or not.
     */
    public isNotAborted(): boolean {
        return this.state != ProcessState.aborted;
    }

    public abort(){
        this.state = ProcessState.aborted;
    }

    public getChildComponent(type: ComponentType): Component {
        if(type == ComponentType.Data){
            return this.dataMap;
        }else{
            this.errChildDoesNotExist(type);
            return undefined;
        }        
    }

    private onStart(){
        this.state = ProcessState.running;
    }

    private onComplete(){
        this.state = ProcessState.idle;
    }
}