import {
    ThingInteractionInstruction,
    VTMNode,
    ValueTarget,
    IInstruction,
    u
} from "../index";


/** Class that represents the 'readProperty' instruction. */
export class ReadProperty extends ThingInteractionInstruction {
    
    private result: ValueTarget = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj, jsonObj.readProperty);

        if(jsonObj.readProperty.result){
            this.result = new ValueTarget("result", this, jsonObj.readProperty.result);
        }
    }

    protected async interactWithThing(thing: WoT.ConsumedThing, name: string) {
        try{
            let result = await thing.readProperty(name, await this.makeOptions());     
            if(this.result){
                await this.result.setValue(result);
            }
        }catch(err){
            u.fatal("Read property failed:\n" + err.message);
        }         
    }
}