import {
    VTMNode,
    Instruction,
    Instructions,
    Pointer,
    ValueSource,
    ReadableData,
    IInstruction,
    IInstructionSwitchCase,
    u
} from "../index";


/** Class that represents the 'switch' instruction. */
export class Switch extends Instruction {

    private switchPtr: Pointer = undefined;
    private cases: Case[] = [];
    private default: Instructions = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj);

        let switchObj = jsonObj.switch;

        if(switchObj.switch){
            this.switchPtr = new Pointer("switchPointer", this, switchObj.switch, [ReadableData], true);
        }        
        
        if(switchObj.cases instanceof Array){
            let index = 0;
            switchObj.cases.forEach(caseObj => this.cases.push(
                new Case("cases/" + index++, this, caseObj)));
        }
        if(switchObj.default){
            this.default = new Instructions("default", this, switchObj.default);
        }  
    }

    protected async executeBody() {
        if(!this.switchPtr){
            return;
        }

        try{
            let satisfied = false;

            for (const _case of this.cases){
                satisfied = await _case.execute(this.switchPtr) && _case.mustBreak();
                if(satisfied){
                    break;
                }
            }

            if(!satisfied && this.default){
                await this.default.execute();
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }   
    }
}

/** Class that represents the 'case' object of the 'switch' instruction. */
class Case extends VTMNode {

    private case: ValueSource = undefined;
    private instructions: Instructions = undefined;
    private break: boolean = true;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstructionSwitchCase){
        super(name, parent);
        
        this.case = new ValueSource("case", this, jsonObj.case);

        if(jsonObj.instructions){
            this.instructions = new Instructions("instructions", this, jsonObj.instructions);
        }
        if(jsonObj.break != undefined){
            this.break = jsonObj.break;
        }        
    }

    /**
     * Performs matching of 'case' value with 'switch' value.
     * Comparison is performed through stringification of
     * both values.
     * 
     * @param _switch The 'switch' pointer pointing to the value 
     * against which the value of the 'case' pointer's value will be matched.
     */
    public async execute(_switch: Pointer = undefined) {        
        try{            
            let isCase = true;
            if(_switch && this.case){
                isCase = u.equalAsStr(_switch.readValue(), await this.case.getValue());
            }
            if(isCase && this.instructions){
                await this.instructions.execute();
            }
            return isCase;
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }
        return false;  
    }

    public mustBreak(): boolean {
        return this.break;
    }
}