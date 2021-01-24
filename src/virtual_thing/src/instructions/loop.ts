import {
    VTMNode,
    Instruction,
    Pointer,
    Interval,
    Instructions,
    Math,
    ReadableData,
    WritableData,
    IInstruction,
    u
} from "../index";


export enum LoopState {
    default,
    break,
    continue
}

/** Class that represents the 'loop' instruction. */
export class Loop extends Instruction {

    protected state: LoopState = LoopState.default;

    private iteratorPointer: Pointer = undefined;
    private initialValueExpr: Math = undefined;
    private condition: Math = undefined;
    private increment: number = 1;
    private interval: Interval = undefined;
    private instructions: Instructions = undefined;
    private conditionFirst: boolean = true;

    public constructor(name: string, parent: VTMNode, jsonObj: IInstruction){
        super(name, parent, jsonObj);

        let loopObj = jsonObj.loop;

        if(loopObj.iterator){
            this.iteratorPointer = new Pointer("iteratorPointer", this, loopObj.iterator,
                                                [ReadableData, WritableData, Number]);
        }        
        if(loopObj.condition){
            this.condition = new Math("condition", this, loopObj.condition);
        }
        if(loopObj.interval){
            this.interval = new Interval("interval", this, loopObj.interval);
        }
        if(loopObj.instructions){
            this.instructions = new Instructions("instructions", this, loopObj.instructions);
        }
        if(loopObj.conditionFirst != undefined){
            this.conditionFirst = loopObj.conditionFirst;
        }
        if(loopObj.increment != undefined){
            this.increment = loopObj.increment;
        }
        if(loopObj.initialValueExpr){
            this.initialValueExpr = new Math("initialValueExpr", this, loopObj.initialValueExpr);
        }
    }

    private async initializeIterator(){

        let initialValue = 0;
        if(this.initialValueExpr){
            initialValue = await this.initialValueExpr.evaluate();
            if(!u.instanceOf(initialValue, Number)){
                u.fatal(`Invalid initialValue: ${JSON.stringify(initialValue)}.`, this.getFullPath());
            }            
        }

        if(this.iteratorPointer){
            this.iteratorPointer.writeValue(initialValue);
        }         
    }

    private async incrementIterator(){
        if(this.iteratorPointer){
            this.iteratorPointer.writeValue(this.iteratorPointer.readValue() + this.increment);
        }
    }

    /** Checks if the next iteration can start. */
    private async canRun() {
        return this.getProcess().isNotAborted() 
                && (!this.condition || await this.condition.evaluate())
                && this.state != LoopState.break;
    }

    private async whiledo(){
        try{
            while(await this.canRun()){
                if(this.interval){
                    await this.interval.waitForNextTick();
                }

                if(this.state == LoopState.continue){
                    this.state = LoopState.default;                    
                    continue;
                }
                
                if(this.instructions){
                    await this.instructions.execute();
                }

                await this.incrementIterator();
            }
        }catch(err){
            throw err;
        }   
    }

    private async dowhile(){
        try{
            do {
                if(this.interval){
                    await this.interval.waitForNextTick();
                }

                if(this.state == LoopState.continue){
                    this.state = LoopState.default;
                    continue;
                }
                                
                if(this.instructions){
                    await this.instructions.execute();
                }

                await this.incrementIterator();
            }while(await this.canRun());
        }catch(err){
            throw err;
        }   
    }

    protected async executeBody() {
        try{
            await this.initializeIterator();

            if(this.interval){
                if(this.interval.isStarted()){
                    this.interval.reset();
                }else{
                    this.interval.start();
                }            
            }

            if(this.conditionFirst){
                await this.whiledo();
            }else{
                await this.dowhile();
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }   
    }

    public break() {
        this.state = LoopState.break;
    }

    public continue() {
        this.state = LoopState.continue;
    }

    /**
     * Indicates whether the next instruction within the
     * local or nested scope of this loop can be executed.
     * It cannot in the following cases:
     * - a 'break' was issued that affects this loop
     * - a 'continue' was issued that affects this loop.
     */
    public canExecuteNextInstruction(): boolean {
        return this.state == LoopState.default;
    }    
}