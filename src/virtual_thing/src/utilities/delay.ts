import {
    VTMNode,
    Math,
    IDelay,
    u
} from "../index";


/** Class that represents the 'delay' property in instruction objects. */
export class Delay extends VTMNode {

    // Source of delay duration in ms
    private math: Math = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IDelay){
        super(name, parent);
        this.math = new Math("math", this, jsonObj);       
    }

    public async execute(){
        let needDelay = await this.math.evaluate();
        if(needDelay > 0){
            try{
                await new Promise<void>(resolve => setTimeout(resolve, needDelay));   
            }catch(err){
                u.fatal("Failed to execute delay:\n" + err.message, this.getFullPath());
            }            
        }
    }
}