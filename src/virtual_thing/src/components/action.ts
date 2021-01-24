import {
    IAction,
    InteractionAffordance,
    RuntimeEvent,
    ComponentFactory,
    ComponentOwner,
    ComponentType,
    Component,
    Data,
    WriteOp,
    ReadOp,
    u
} from "../index";


/** Class that represents an Action interfaction affordance. */
export class Action extends InteractionAffordance {

    //#region Child components
    private input: Data = undefined;
    private output: Data = undefined;
    //#endregion

    public constructor(name: string, parent: ComponentOwner, jsonObj: IAction){        
        super(name, parent, jsonObj);

        if(jsonObj.input){
            this.input = ComponentFactory.createComponent(ComponentType.Input,
                "input", this, jsonObj.input) as Data;
        }            

        if(jsonObj.output){
            this.output = ComponentFactory.createComponent(ComponentType.Output,
                "output", this, jsonObj.output) as Data;
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
            case ComponentType.UriVariable:
                component = this.uriVariables;
                break;
            case ComponentType.Input:
                component = this.input;
                break;
            case ComponentType.Output:
                component = this.output;
                break;
        }
        if(component == undefined){
            this.errChildDoesNotExist(type);
        }
        return component;
    }

    /**
     * The action handler for the respective action of the ExposedThing.
     * 
     * @param params The params passed by the ExposedThing.
     * @param options The options passed by the ExposedThing.
     */
    public async onInvoke(params: any, options?: WoT.InteractionOptions) {        
        this.reportFunctionCall("onInvoke()");
        
        try{   
            this.parseUriVariables(options);                             
            if(this.input){
                this.input.reset();
                if(params !== undefined){
                    this.input.write(WriteOp.copy, params);
                }                
            }
            await this.onInteractionEvent(RuntimeEvent.invokeAction);
            if(this.output){
                return this.output.read(ReadOp.copy);
            }            
        }catch(err){
            u.error("Invoke action failed:\n" + err.message, this.getFullPath());
        }
    }
}