import {
    VTMNode,
    ThingInteractionInstruction,
    IInstruction,
    u
} from "../index";


/** Class that represents the 'unsubscribeEvent' instruction. */
export class UnsubscribeEvent extends ThingInteractionInstruction {

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj, jsonObj.unsubscribeEvent);        
    }

    protected async interactWithThing(thing: WoT.ConsumedThing, name: string) {
        try{
            await thing.unsubscribeEvent(name);
        }catch(err){
            u.fatal("Unubscribe event failed:\n" + err.message);
        }         
    }
}