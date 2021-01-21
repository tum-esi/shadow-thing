import {
    VTMNode,
    Instructions,
    ThingInteractionInstruction,
    IInstruction,
    ValueTarget,
    u
} from "../index";


/** Class that represents the 'observePropery' instruction. */
export class ObserveProperty extends ThingInteractionInstruction {

    private onChange: Instructions = undefined;
    private newValue: ValueTarget = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj, jsonObj.observeProperty);
        
        if(jsonObj.observeProperty.onChange){
            this.onChange = new Instructions("onChange", this, jsonObj.observeProperty.onChange);
        }  

        if(jsonObj.observeProperty.newValue){
            this.newValue = new ValueTarget("newValue", this, jsonObj.observeProperty.newValue);
        }
    }

    private async onPropertyChanged(newValue: any){
        try{
            if(this.newValue){
                await this.newValue.setValue(newValue);
            }
            if(this.onChange){
                await this.onChange.execute();
            }            
        }catch(err){
            u.fatal("Observe property handler failed:\n" + err.message, this.getFullPath());
        }
    }

    protected async interactWithThing(thing: WoT.ConsumedThing, name: string) {
        try{
            await thing.observeProperty(name, data => this.onPropertyChanged(data), await this.makeOptions());
        }catch(err){
            u.fatal("Observe property failed:\n" + err.message);
        }         
    }
}