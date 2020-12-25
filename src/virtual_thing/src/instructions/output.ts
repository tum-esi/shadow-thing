import {
    Instruction,
    VTMNode,
    ParameterizedString,
    IInstruction,
    ConsoleMessageType,
    u
} from "../index";


/** Class that represents the console output instructions. */
export class Output extends Instruction {

    private textExpr: ParameterizedString = undefined;
    private messageType: ConsoleMessageType = ConsoleMessageType.log;
    
    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj);

        if(jsonObj.log){
            this.textExpr = new ParameterizedString("log", this, jsonObj.log);
            this.messageType = ConsoleMessageType.log;
        }else if(jsonObj.info){
            this.textExpr = new ParameterizedString("info", this, jsonObj.info);
            this.messageType = ConsoleMessageType.info;
        }else if(jsonObj.warn){
            this.textExpr = new ParameterizedString("warn", this, jsonObj.warn);
            this.messageType = ConsoleMessageType.warn;
        }else if(jsonObj.debug){
            this.textExpr = new ParameterizedString("debug", this, jsonObj.debug);
            this.messageType = ConsoleMessageType.debug;
        }else{
            this.textExpr = new ParameterizedString("error", this, jsonObj.error);
            this.messageType = ConsoleMessageType.error;
        }
    }

    protected executeBody(){        
        try{
            let message = this.textExpr.resolveAndGet();
            switch(this.messageType){
                case ConsoleMessageType.log:
                    u.log(message, undefined, false);
                    break;
                case ConsoleMessageType.info:
                    u.info(message, undefined, false);
                    break;
                case ConsoleMessageType.warn:
                    u.warn(message, undefined, false);
                    break;
                case ConsoleMessageType.debug:
                    u.debug(message, undefined, false);
                    break;
                case ConsoleMessageType.error:
                    u.error(message, undefined, false);
                    break;
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }   
    }    
}