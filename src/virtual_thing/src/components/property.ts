import {
    InteractionAffordance,
    RuntimeEvent,
    ComponentFactory,
    ComponentOwner,
    ComponentType,
    Component,
    Data,
    WriteOp,
    IProperty,
    IDataSchema,
    u
} from "../index";
import { ReadOp } from "./data";


/** Class that represents a Property interfaction affordance. */
export class Property extends InteractionAffordance {

    //#region Child components
    private data: Data = undefined;
    //#endregion

    public constructor(name: string, parent: ComponentOwner, jsonObj: IProperty){
        super(name, parent, jsonObj);

        this.data = ComponentFactory.createComponent(ComponentType.Data,
            "data", this, jsonObj as IDataSchema) as Data;
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
            case ComponentType.Output:
                component = this.data;
                break;
        }
        if(component == undefined){
            this.errChildDoesNotExist(type);
        }
        return component;
    }
        
    /**
     * The read handler for the respective property of the ExposedThing.
     * 
     * @param options The options passed by the ExposedThing.
     */
    public async onRead(options?: WoT.InteractionOptions) {
        this.reportFunctionCall("onRead()");
        try{
            this.parseUriVariables(options);
            await this.onInteractionEvent(RuntimeEvent.readProperty);
            return this.data.read(ReadOp.copy);
        }catch(err){            
            u.error("Read property failed:\n" + err.message, this.getFullPath());
        }
    }
        
    /**
     * The write handler for the respective property of the ExposedThing.
     * 
     * @param value The value passed by the ExposedThing. If the value of this parameter
     * is undefined, then default value according to the schema will be sent.
     * @param options The options passed by the ExposedThing.
     */
    public async onWrite(value: any, options?: WoT.InteractionOptions) {   
        this.reportFunctionCall("onWrite()");     
        try{   
            this.parseUriVariables(options);     
            this.data.reset();
            if(value !== undefined){
                this.data.write(WriteOp.copy, value);
            }
            await this.onInteractionEvent(RuntimeEvent.writeProperty);
        }catch(err){
            u.error("Write property failed:\n" + err.message, this.getFullPath());
        }
    }
}