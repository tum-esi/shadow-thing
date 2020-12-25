import {
    Instruction,
    VTMNode,
    Process,
    Pointer,
    IInstruction,
    u
} from "../index";


/** Class that represents the 'invokeProcess' instruction. */
export class InvokeProcess extends Instruction {

    private processPtr: Pointer = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj);

        if(jsonObj.invokeProcess){
            this.processPtr = new Pointer("pointer", this, jsonObj.invokeProcess, [Process]);
        }        
    }

    protected async executeBody() {
        try{
            if(this.processPtr){
                await (this.processPtr.readValue() as Process).invoke();
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }   
    }
}
