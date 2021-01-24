import {
    VTMNode,
    ValueSource,
    ValueTarget,
    IInstruction,
    ThingInteractionInstruction,
    u
} from "../index";


/** Class that represents the 'invokeAction' instruction. */
export class InvokeAction extends ThingInteractionInstruction {

    private input: ValueSource = undefined;
    private output: ValueTarget = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj, jsonObj.invokeAction);
        
        if(jsonObj.invokeAction.input){
            this.input = new ValueSource("input", this, jsonObj.invokeAction.input);
        }
        if(jsonObj.invokeAction.output){
            this.output = new ValueTarget("output", this, jsonObj.invokeAction.output);
        }
    }

    protected async interactWithThing(thing: WoT.ConsumedThing, name: string) {
        try{
            let input = this.input ? await this.input.getValue() : undefined;
            let result = await thing.invokeAction(name, input, await this.makeOptions());     
            if(this.output){
                await this.output.setValue(result);
            }
        }catch(err){
            u.fatal("Invoke action failed:\n" + err.message);
        }         
    }
}