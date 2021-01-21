import {
    Instruction,
    VTMNode,
    IInstruction
} from "../index";


/**
 * Class that represents an empty instruction.
 * With a specified 'delay', can be used as a plain delay instruction.
 */
export class Empty extends Instruction {

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj);
    }

    protected executeBody() {
        
    }
}