import {
    VTMNode,
    Instruction,
    Instructions,
    IInstruction,
    u
} from "../index";


/** Class that represents the 'trycatch' instruction. */
export class TryCatch extends Instruction {

    private static readonly erroMessageExpression: RegExp = /^\/?err$/;

    private try: Instructions = undefined;
    private catch: Instructions = undefined;
    private errorMessage: string = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj);

        let tryObj = jsonObj.trycatch;

        if(tryObj.try){
            this.try = new Instructions("try", this, tryObj.try);
        }
        if(tryObj.catch){
            this.catch = new Instructions("catch", this, tryObj.catch);
        }
    }

    /**
     * Check is the given string is a pointer tocken that
     * is used to obtain the error message of a 'trycatch' instruction
     * by a pointer which is in the scope of the 'trycatch' instruction.
     * 
     * @param tocken 
     */
    public static isErrorMessageTocken(tocken: string): boolean {
        return tocken.match(this.erroMessageExpression) != undefined;
    }

    public getErrorMessage(): string {
        return this.errorMessage;
    }

    protected async executeBody() {
        try {
            this.errorMessage = undefined;
            if(this.try){
                await this.try.execute();   
            }            
        } catch (err) {
            this.errorMessage = err.message;
            try{
                if(this.catch){
                    await this.catch.execute();
                }            
            }catch(err){
                u.fatal(err.message, this.getFullPath());
            }   
        }
    }

}