import {
    VTMNode,
    Instruction,
    Instructions,    
    Math,
    IInstruction,
    u
} from "../index";


/** Class that represents the 'ifelse' instruction. */
export class IfElse extends Instruction {

    private if: If = undefined;
    private elif: If[] = [];
    private else: Instructions = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj);

        let ifelseObj = jsonObj.ifelse;

        if(ifelseObj.if){
            this.if = new If("if", this, ifelseObj.if);
        }
        if(ifelseObj.elif instanceof Array){
            let index = 0;
            ifelseObj.elif.forEach(ifObj => this.elif.push(
                new If("elif/" + index++, this, ifObj)));
        }
        if(ifelseObj.else){
            this.else = new Instructions("else", this, ifelseObj.else);
        }        
    }

    protected async executeBody() {
        try{
            if(!this.if){
                return;
            }
            
            let satisfied = await this.if.execute();

            if(!satisfied){
                for (let _if of this.elif){
                    satisfied = await _if.execute();

                    if(satisfied) {
                        break;
                    }
                }
            }

            if(!satisfied && this.else){
                await this.else.execute();
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }    
    }
}

/** Class that represents the 'if' object of the 'ifelse' instruction. */
class If extends VTMNode {

    private condition: Math = undefined;
    private instructions: Instructions = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: any){
        super(name, parent);
        
        if(jsonObj.condition){
            this.condition = new Math("condition", this, jsonObj.condition);
        }
        if(jsonObj.instructions){
            this.instructions = new Instructions("instructions", this, jsonObj.instructions);
        }        
    }

    public async execute() {
        try{
            if(await this.condition.evaluate()){
                await this.instructions.execute();
                return true;
            }
            return false;
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }    
        return false;
    }
}