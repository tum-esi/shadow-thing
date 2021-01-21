import {
    Instruction,
    VTMNode,
    ValueSource,
    IInstruction,
    Event,
    Pointer,
    u
} from "../index";


/** Class that represents the 'emitEvent' instruction. */
export class EmitEvent extends Instruction {

    private eventPtr: Pointer = undefined;
    private data: ValueSource = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj);

        let emitEventObj = jsonObj.emitEvent;

        this.eventPtr = new Pointer("pointer", this, jsonObj.emitEvent.pointer, [Event]);
        
        if(emitEventObj.data){
            this.data = new ValueSource("data", this, emitEventObj.data);
        }        
    }

    protected async executeBody(){
        try{            
            let event = this.eventPtr.readValue() as Event;
            if(this.data){
                await event.emit(await this.data.getValue());
            }else{
                await event.emit();
            }            
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }    
    }
}