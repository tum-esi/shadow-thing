import { IInstructionInvokeProcessObj } from "../common/interfaces";
import {
    Instruction,
    VTMNode,
    Process,
    Pointer,
    IInstruction,
    StateMachineOperation,
    IParameterizedString,
    u
} from "../index";


/** Class that represents the 'invokeProcess' instruction. */
export class InvokeProcess extends Instruction {

    private processPtr: Pointer = undefined;
    private stateMachineOperation: StateMachineOperation = StateMachineOperation.transit;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj);
        
        if(u.instanceOf(jsonObj.invokeProcess, Array) || u.instanceOf(jsonObj.invokeProcess, String)){
            this.processPtr = new Pointer("pointer", this, jsonObj.invokeProcess as IParameterizedString, [Process]);
        }else{
            let invokeProcessObj = (jsonObj.invokeProcess as IInstructionInvokeProcessObj);
            this.processPtr = new Pointer("pointer", this, invokeProcessObj.pointer, [Process]);
            if(invokeProcessObj.smOperation){
                this.stateMachineOperation = invokeProcessObj.smOperation;
            }
        }
    }

    protected async executeBody() {
        try{
            if(this.processPtr){
                await (this.processPtr.readValue() as Process).invoke(this.stateMachineOperation);
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }   
    }
}
