import {
    VTMNode,
    ValueSource,
    IInstruction,
    ThingInteractionInstruction,
    u
} from "../index";


/** Class that represents the 'writeProperty' instruction. */
export class WriteProperty extends ThingInteractionInstruction {

    private value: ValueSource = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj, jsonObj.writeProperty);

        if(jsonObj.writeProperty.value){
            this.value = new ValueSource("value", this, jsonObj.writeProperty.value);
        }
    }

    protected async interactWithThing(thing: WoT.ConsumedThing, name: string) {
        try{
            let value = this.value ? await this.value.getValue() : undefined;
            await thing.writeProperty(name, value, await this.makeOptions());
        }catch(err){
            u.fatal("Write property failed:\n" + err.message);
        }         
    }
}