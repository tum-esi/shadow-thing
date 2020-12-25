import {
    VTMNode,
    Delay,
    Loop,
    InvokeAction,
    SubscribeEvent,
    UnsubscribeEvent,
    ReadProperty,
    WriteProperty,
    EmitEvent,
    InvokeProcess,
    IfElse,
    Switch,
    Move,
    TryCatch,
    Output,
    Control,
    Fake,
    Empty,
    IInstruction,
    IInstructions,
    u,
    ObserveProperty,
    UnobserveProperty
} from "../index";


export enum InstructionType {
    readProperty = "readProperty",
    writeProperty = "writeProperty",
    observeProperty = "observeProperty",
    unobserveProperty = "unobserveProperty",
    invokeAction = "invokeAction",
    subscribeEvent = "subscribeEvent",
    unsubscribeEvent = "unsubscribeEvent",
    emitEvent = "emitEvent",
    invokeProcess = "invokeProcess",
    move = "move",
    ifelse = "ifelse",
    switch = "switch",
    loop = "loop",
    trycatch = "trycatch",
    log = "log",
    info = "info",
    warn = "warn",
    debug = "debug",
    error = "error",
    control = "control",
    fake = "fake",
    empty = "emepty"
}


/** Class that represents the 'instructions' array in a Virtual Thing Description. */
export class Instructions extends VTMNode {

    private instructions: Instruction[] = [];

    public constructor(name: string, parent: VTMNode, jsonObj: IInstructions){
        super(name, parent);

        if(jsonObj instanceof Array){   
            let index = 0;         
            jsonObj.forEach(instrObj => 
                this.instructions.push(this.createInstruction(instrObj, index++)));
        }
    }

    /**
     * Creates an instance of 'Instruction' from the given object.
     * Uses index together with the instruction type to create a name for
     * the instance (node name).
     * 
     * @param jsonObj A valid object from an 'instructions' array
     * in a Virtula Thing Description. If the object contains several
     * properties representing instructions, only one of them will be
     * created.
     * @param index The index of the object in the 'instructions' array.
     */
    private createInstruction(jsonObj: IInstruction, index: number): Instruction{
        if(jsonObj.readProperty){
            return new ReadProperty("" + index + "/" + InstructionType.readProperty, this, jsonObj);
        }else if(jsonObj.writeProperty){
            return new WriteProperty("" + index + "/" + InstructionType.writeProperty, this, jsonObj);
        }else if(jsonObj.observeProperty){
            return new ObserveProperty("" + index + "/" + InstructionType.observeProperty, this, jsonObj);
        }else if(jsonObj.unobserveProperty){
            return new UnobserveProperty("" + index + "/" + InstructionType.unobserveProperty, this, jsonObj);
        }else if(jsonObj.invokeAction){
            return new InvokeAction("" + index + "/" + InstructionType.invokeAction, this, jsonObj);
        }else if(jsonObj.subscribeEvent){
            return new SubscribeEvent("" + index + "/" + InstructionType.subscribeEvent, this, jsonObj);
        }else if(jsonObj.unsubscribeEvent){
            return new UnsubscribeEvent("" + index + "/" + InstructionType.unsubscribeEvent, this, jsonObj);
        }else if(jsonObj.emitEvent){
            return new EmitEvent("" + index + "/" + InstructionType.emitEvent, this, jsonObj);
        }else if(jsonObj.invokeProcess){
            return new InvokeProcess("" + index + "/" + InstructionType.invokeProcess, this, jsonObj);
        }else if(jsonObj.move){
            return new Move("" + index + "/" + InstructionType.move, this, jsonObj);
        }else if(jsonObj.ifelse){
            return new IfElse("" + index + "/" + InstructionType.ifelse, this, jsonObj);
        }else if(jsonObj.switch){
            return new Switch("" + index + "/" + InstructionType.switch, this, jsonObj);
        }else if(jsonObj.loop){
            return new Loop("" + index + "/" + InstructionType.loop, this, jsonObj);
        }else if(jsonObj.trycatch){
            return new TryCatch("" + index + "/" + InstructionType.trycatch, this, jsonObj);
        }else if(jsonObj.log){
            return new Output("" + index + "/" + InstructionType.log, this, jsonObj);
        }else if(jsonObj.info){
            return new Output("" + index + "/" + InstructionType.info, this, jsonObj);
        }else if(jsonObj.warn){
            return new Output("" + index + "/" + InstructionType.warn, this, jsonObj);
        }else if(jsonObj.debug){
            return new Output("" + index + "/" + InstructionType.debug, this, jsonObj);
        }else if(jsonObj.error){
            return new Output("" + index + "/" + InstructionType.error, this, jsonObj);
        }else if(jsonObj.control){
            return new Control("" + index + "/" + InstructionType.control, this, jsonObj);
        }else if(jsonObj.fake){
            return new Fake("" + index + "/" + InstructionType.fake, this, jsonObj);
        }else{
            return new Empty("" + index + "/" + InstructionType.empty, this, jsonObj);
        }
    }

    /**
     * Check if the next instruction from the instructions array can be executed.
     * The next instruction can't be executed in the following cases:
     * - the parent process was aborted
     * - the instructions are in the local or a nested scope of a 'Loop' node,
     * and execution of the next instruction within that loop was prevented
     * by 'break' or 'continue' instructions.
     */
    private canExecuteNextInstruction(): boolean {
        return this.getProcess().isNotAborted()
                && (!this.getParentLoop() || this.getParentLoop().canExecuteNextInstruction())
    }

    /**
     * Executes instructions one by one as long as
     * the next instruction can be executed.
     */
    public async execute() {
        try{
            for (const instr of this.instructions) {         
                if(this.canExecuteNextInstruction()){
                    await instr.execute();
                }else{
                    return;
                }
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }    
    }
}

/** Base class for items of the 'instructions' array in a Virtual Thing Description. */
export abstract class Instruction extends VTMNode {

    protected delay: Delay = undefined;
    protected wait: boolean = true;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){        
        super(name, parent);

        if(jsonObj.delay){
            this.delay = new Delay("delay", this, jsonObj.delay);
        }
        if(jsonObj.wait != undefined){
            this.wait = jsonObj.wait;        
        }
    }
    
    private async executeWithDelay(){
        try{
            if(this.delay){
                await this.delay.execute();
            }
            await this.executeBody();
        }catch(err){
            throw err;
        }    
    }

    /** Executes the specific part of the instruction. */
    protected abstract executeBody();

    public async execute() {
        try{
            if(this.wait){
                await this.executeWithDelay();
            }else{
                this.executeWithDelay();
            }
        }catch(err){
            throw err;
        }    
    }
}