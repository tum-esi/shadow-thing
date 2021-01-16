import {
    VTMNode,
    ComponentFactory,
    ComponentOwner,
    ComponentType,
    Component,
    Trigger,
    Instructions,
    Math,
    Delay,
    RuntimeEvent,
    Action,
    Property,
    Event,
    IProcess,
    u,
    ComponentMap,
    IStateMachine,
    Data,
    ValueSource,
    IStateMachineState,
    IStateMachineTransition,
    IStateMachineTransitions,
    IStateMachineStates,
    ReadOp,
    WriteOp
} from "../index";


export enum ProcessState {
    idle,
    running,
    aborted
}

export enum StateMachineOperation {
    transit = "transit",
    reset = "reset",
    error = "error"
}

/** Class that represents a Process in Virtual Thing Description. */
export class Process extends ComponentOwner {

    private readonly defaultNameOnReadProperty = "read";
    private readonly defaultNameOnWritePropery = "write";
    private readonly defaultNameOnSubscribeEvent = "subscribe";
    private readonly defaultNameOnUnsubscribeEvent = "unsubscribe";

    private processState: ProcessState = ProcessState.idle;

    private triggers: Trigger[] = [];
    private condition: Math = undefined;
    private dataMap: ComponentMap = undefined;
    private instructions: Instructions = undefined;
    private stateMachine: StateMachine = undefined;
    private wait: boolean = true;    

    public constructor(name: string, parent: ComponentOwner, jsonObj: IProcess){

        super(name, parent);
            
        if(jsonObj.triggers instanceof Array){
            let index = 0;
            jsonObj.triggers.forEach(trigObj => this.triggers.push(new Trigger("triggers/" + index++, this, trigObj)));
        }

        if(jsonObj.instructions){
            this.instructions = new Instructions("instructions", this, jsonObj.instructions);
        }
        if(jsonObj.condition){
            this.condition = new Math("condition", this, jsonObj.condition);
        }                
        if(jsonObj.dataMap){
            this.dataMap = ComponentFactory.createComponentMap(ComponentType.Data,
                "dataMap", this, jsonObj.dataMap);
        }
        if(jsonObj.stateMachine){
            this.stateMachine = new StateMachine("stateMachine", this, jsonObj.stateMachine);
        }
        if(jsonObj.wait != undefined){
            this.wait = jsonObj.wait;
        }

        this.getModel().registerProcess(this);
    }

    /**
     * Setup the process. Should be called before starting the Model, but
     * after all the instances of 'Behavior' are created.
     */
    public async setup(){

        /**
         * If there are no explicit triggers specified for a process in a
         * Virtual Thing Description Model, and the process is in the
         * scope of an interaction affordance node, then the process
         * will register itself to be invoked automatically when respective
         * runtime events are fired in that interaction affordance.
         * To which runtime event the process will hook depends on the name of the process.
         */
        if(this.triggers.length == 0){

            let behavior = this.getBehavior();

            // If the process belongs to a Property interaction affordance
            if(behavior instanceof Property){

                if(this.getName() == this.defaultNameOnReadProperty){
                    behavior.registerProcess(RuntimeEvent.readProperty, this);
                }else if(this.getName() == this.defaultNameOnWritePropery){
                    behavior.registerProcess(RuntimeEvent.writeProperty, this);
                }else{
                    behavior.registerProcess(RuntimeEvent.readProperty, this);
                    behavior.registerProcess(RuntimeEvent.writeProperty, this);
                }

            // If the process belongs to an Action interaction affordance
            }else if(behavior instanceof Action){

                behavior.registerProcess(RuntimeEvent.invokeAction, this);

            // If the process belongs to an Event interaction affordance
            }else if(behavior instanceof Event){

                if(this.getName() == this.defaultNameOnSubscribeEvent){
                    behavior.registerProcess(RuntimeEvent.subscribeEvent, this);    
                }else if(this.getName() == this.defaultNameOnUnsubscribeEvent){
                    behavior.registerProcess(RuntimeEvent.unsubscribeEvent, this);    
                }else{
                    behavior.registerProcess(RuntimeEvent.emitEvent, this);
                }                
            }            
        }

        // Initialize and validate State Machine if present
        if(this.stateMachine){
            await this.stateMachine.initAndValidate();
        }
    }
    
    public async invoke(op: StateMachineOperation = StateMachineOperation.transit){
        try{
            if(!this.condition || await this.condition.evaluate()){
                this.onStart();
                if(this.wait){
                    await this.execute(op);
                }else{
                    this.execute(op);
                }                
                this.onComplete();
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }    
    }

    private async execute(op: StateMachineOperation){
        try{
            if(this.stateMachine){
                await this.stateMachine.transit(op);
            }
            if(this.instructions){
                await this.instructions.execute();
            }
        }catch(err){
            u.fatal(err.message);
        }
    }

    /**
     * Indicates whether the process is in 'aborted' state.
     * Can be used by the instructions of the process to decide
     * whether to continue execution or not.
     */
    public isNotAborted(): boolean {
        return this.processState != ProcessState.aborted;
    }

    public abort(){
        this.processState = ProcessState.aborted;
    }

    public getChildComponent(type: ComponentType): Component {
        if(type == ComponentType.Data){
            return this.dataMap;
        }else if(type == ComponentType.StateMachine){
            return this.stateMachine;
        }else{
            this.errChildDoesNotExist(type);
            return undefined;
        }        
    }

    private onStart(){
        this.processState = ProcessState.running;
    }

    private onComplete(){
        this.processState = ProcessState.idle;
    }
}

/** Class that represents a StateMachine of a Process.*/
export class StateMachine extends ComponentOwner {

    private input: Data = undefined;
    private output: Data = undefined;
    private states: StateMachineStates = undefined;
    private delay: Delay = undefined;    
    private initialState: string = undefined;
    private errorTransitions: StateMachineTransitions = undefined;
    private resetTransitions: StateMachineTransitions = undefined;
    private before: Instructions = undefined;
    private after: Instructions = undefined;

    /**
     * This is needed to allow access to current state name in a VTD using the existing Pointer mechanism
     */
    private currentStateNameHolder: Data = new Data("state", this, {type: "string"});

    public constructor(name: string, parent: VTMNode, jsonObj: IStateMachine){

        super(name, parent);

        if(jsonObj.delay){
            this.delay = new Delay("delay", this, jsonObj.delay);
        }
        if(jsonObj.input){
            this.input = ComponentFactory.createComponent(ComponentType.Input,
                "input", this, jsonObj.input) as Data;
        }
        if(jsonObj.output){
            this.output = ComponentFactory.createComponent(ComponentType.Output,
                "output", this, jsonObj.output) as Data;
        }
        if(jsonObj.reset){
            this.resetTransitions = new StateMachineTransitions("reset", this, jsonObj.reset);
        }
        if(jsonObj.error){
            this.errorTransitions = new StateMachineTransitions("error", this, jsonObj.error);
        }
        if(jsonObj.states){
            this.states = new StateMachineStates("states", this, jsonObj.states);
        }
        if(jsonObj.before){
            this.before = new Instructions("before", this, jsonObj.before);
        }
        if(jsonObj.after){
            this.after = new Instructions("after", this, jsonObj.after);
        }
        this.initialState = jsonObj.initialState;
    }

    public getChildComponent(type: ComponentType): Component {
        let component = undefined;
        
        switch(type){
            case ComponentType.Input:
                component = this.input;
                break;
            case ComponentType.Output:
                component = this.output;
                break;
            case ComponentType.State:
                component = this.currentStateNameHolder;
                break;
        }
        if(component == undefined){
            this.errChildDoesNotExist(type);
        }
        return component;     
    }

    public async transit(op: StateMachineOperation){
        try{ 
            if(this.delay){
                await this.delay.execute();
            }

            // Execute the "before" sequence
            if(this.before){
                await this.before.execute();
            }

            /**
             * If operation was not handled by the state-specific transitions,
             * then handle by the default transitions if applicable
             */
            if(!(await this.states.transit(op))){
                if(op == StateMachineOperation.reset && this.resetTransitions){                
                    await this.resetTransitions.transit();
                }else if(op == StateMachineOperation.error && this.errorTransitions){
                    await this.errorTransitions.transit();
                }        
            }    
            
            // Execute the "after" sequence
            if(this.after){
                await this.after.execute();
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }
    }

    /**
     * Validates the state machine: checks whether all states
     * specified int transitions are actually declared.  
     * Enters the initial state.
     */
    public async initAndValidate(){
        this.reportFunctionCall("initAndValidate()");

        if(this.states && this.initialState){
            if(this.states.hasState(this.initialState)){

                // Enter the initial state
                await this.states.getState(this.initialState).doEnter();
            }else{
                u.fatal("Initial state is invalid!", this.getFullPath());
            }            

            this.states.validate();
        }else{
            u.fatal("A state machine requires \"states\" and \"initialState\"!", this.getFullPath());
        }
        if(this.resetTransitions){
            this.resetTransitions.validate();
        }
        if(this.errorTransitions){
            this.errorTransitions.validate();
        }
    }

    public getStates(): StateMachineStates {
        return this.states;
    }

    public getCurrentState(): StateMachineState {
        if(this.currentStateNameHolder && this.states){
            let currentStateName = this.currentStateNameHolder.read(ReadOp.get);
            return this.states.getState(currentStateName);
        }
        return undefined;
    }

    public hasInput() {
        return this.input != undefined;
    }

    public hasOutput() {
        return this.output != undefined;
    }

    public getInput() {
        return this.input;
    }

    public getOutput() {
        return this.output;
    }

    public getCurrentStateNameHolder() {
        return this.currentStateNameHolder;
    }
}

/** Class that represents a State transitiona in a StateMachine. */
class StateMachineTransition extends VTMNode {

    private delay: Delay = undefined;
    private next: string = undefined;
    private input: ValueSource = undefined;
    private condition: Math = undefined;
    private output: ValueSource = undefined;
    private before: Instructions = undefined;
    private after: Instructions = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IStateMachineTransition){
        super(name, parent);

        if(jsonObj.delay){
            this.delay = new Delay("delay", this, jsonObj.delay);
        }
        if(jsonObj.input){
            this.input = new ValueSource("input", this, jsonObj.input);
        }
        if(jsonObj.condition){
            this.condition = new Math("condition", this, jsonObj.condition);
        }     
        if(jsonObj.output){
            this.output = new ValueSource("output", this, jsonObj.output);
        }
        if(jsonObj.before){
            this.before = new Instructions("before", this, jsonObj.before);
        }
        if(jsonObj.after){
            this.after = new Instructions("after", this, jsonObj.after);
        }
        this.next = jsonObj.next;
    }

    /**
     * Performs this Transitions if applicable.
     */
    public async apply(): Promise<boolean> {
        try{
            let isMatched = true;

            isMatched = isMatched && (!this.condition || await this.condition.evaluate());

            if(isMatched && this.input){
                let smInput = this.getParentStateMachine().getInput().read(ReadOp.get);
                let transitionInput = await this.input.getValue();
                isMatched = isMatched && u.equalAsStr(smInput, transitionInput);
            }

            if(isMatched){
                
                if(this.delay){
                    await this.delay.execute();
                }

                // Execute the "before" sequence
                if(this.before){
                    await this.before.execute();
                }

                // Exit current state
                await this.getParentStateMachine().getCurrentState().doExit();

                // Enter next state
                await this.getParentStateMachine().getStates().getState(this.next).doEnter();
                
                // Write Mealy output (will overwrite the Moore output of the just entered state if was defined)
                if(this.output){
                    this.getParentStateMachine().getOutput().write(WriteOp.set, await this.output.getValue());
                }
                
                // Execute the "after" sequence
                if(this.after){
                    await this.after.execute();
                }
            }

            return isMatched;
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }
        return false;
    }

    public validate(){
        if(!this.next){
            u.fatal("\"next\" is required!", this.getFullPath());
        }
        if(this.input && !this.getParentStateMachine().hasInput()){
            u.fatal("There is no \"input\" defined for the State machine!", this.getFullPath());
        }
        if(this.output && !this.getParentStateMachine().hasOutput()){
            u.fatal("There is no \"output\" defined for the State machine!", this.getFullPath());
        }
        if(this.next){
            let sm = this.getParentStateMachine();
            if(sm){
                let states = sm.getStates();
                if(states){
                    if(!states.hasState(this.next)){
                        u.fatal("No such state defined: \"" + this.next + "\"", this.getFullPath());
                    }
                }
            }
        }
    }
}

/** Class that represents a collection of State transitions in a StateMachine. */
class StateMachineTransitions extends VTMNode {

    private transitions: StateMachineTransition[] = [];

    public constructor(name: string, parent: VTMNode, jsonObj: IStateMachineTransitions){
        super(name, parent);

        let i = 0;
        for(let transition of jsonObj){
            this.transitions.push(new StateMachineTransition("" + i++, this, transition));
        }
    }

    public async transit(): Promise<boolean> {
        try{
            // Apply the first suitable transition
            for(let transition of this.transitions){
                if(await transition.apply()){
                    return true;
                }
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }
        return false;
    }

    public validate(){
        for(let transition of this.transitions){
            transition.validate();
        }
    }
}

/** Class that represents a collection of States in a StateMachine. */
class StateMachineStates extends VTMNode {

    private states: Map<string, StateMachineState> = new Map();

    public constructor(name: string, parent: VTMNode, jsonObj: IStateMachineStates){
        super(name, parent);

        for (let key in jsonObj){
            this.states.set(key, new StateMachineState(key, this, jsonObj[key]));
        }  
    }

    public async transit(op: StateMachineOperation): Promise<boolean> {
        try{
            return await this.getParentStateMachine().getCurrentState().transit(op);
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }
        return false;
    }

    public validate(){
        for(let key of Array.from(this.states.keys())){
            this.states.get(key).validate();
        }
    }

    public hasState(state: string){
        return this.states.has(state);
    }

    public getState(state: string){
        return this.states.get(state);
    }
}

/** Class that represents a State in a StateMachine. */
class StateMachineState extends VTMNode {
    
    private delay: Delay = undefined;
    private output: ValueSource = undefined;
    private nextStateTransitions: StateMachineTransitions = undefined;
    private errorTransitions: StateMachineTransitions = undefined;
    private resetTransitions: StateMachineTransitions = undefined;
    private enter: Instructions = undefined;
    private exit: Instructions = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IStateMachineState){
        super(name, parent);

        if(jsonObj.delay){
            this.delay = new Delay("delay", this, jsonObj.delay);
        }
        if(jsonObj.reset){
            this.resetTransitions = new StateMachineTransitions("reset", this, jsonObj.reset);
        }
        if(jsonObj.error){
            this.errorTransitions = new StateMachineTransitions("error", this, jsonObj.error);
        }
        if(jsonObj.trans){
            this.nextStateTransitions = new StateMachineTransitions("trans", this, jsonObj.trans);
        }
        if(jsonObj.output){
            this.output = new ValueSource("output", this, jsonObj.output);
        }
        if(jsonObj.enter){
            this.enter = new Instructions("enter", this, jsonObj.enter);
        }
        if(jsonObj.exit){
            this.exit = new Instructions("exit", this, jsonObj.exit);
        }
    }

    public async transit(op: StateMachineOperation): Promise<boolean> {
        try{
            let transitions: StateMachineTransitions = undefined;
            switch(op){
                case StateMachineOperation.reset:
                    transitions = this.resetTransitions;
                    break;
                case StateMachineOperation.error:
                    transitions = this.errorTransitions;
                    break;
                default:
                    transitions = this.nextStateTransitions;
                    break;
            }
            if(transitions){
                if(this.delay){
                    await this.delay.execute();
                }
                return await transitions.transit();
            }            
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }
        return false;
    }

    public validate(){
        if(this.output && !this.getParentStateMachine().hasOutput()){
            u.fatal("There is no \"output\" defined for the State machine.", this.getFullPath());
        }
        if(this.resetTransitions){
            this.resetTransitions.validate();
        }
        if(this.errorTransitions){
            this.errorTransitions.validate();
        }
        if(this.nextStateTransitions){
            this.nextStateTransitions.validate();
        }
    }

    public async doExit(){
        try{            
            if(this.enter){
                // Execute exit sequence
                await this.exit.execute();
            }
        }catch(err){
            u.fatal("Exit state failed:\n" + err.message, this.getFullPath());
        }        
    }

    public async doEnter(){
        try{
            // Set current state to this
            this.getParentStateMachine().getCurrentStateNameHolder().write(WriteOp.set, this.getName());

            // Write Moore output if any (will be overwritten by Mealy output if defined in the Transition that invoked this).
            if(this.output){
                this.getParentStateMachine().getOutput().write(WriteOp.set, await this.output.getValue());
            }

            // Execute enter sequence
            if(this.enter){
                await this.enter.execute();
            }
        }catch(err){
            u.fatal("Enter state failed:\n" + err.message, this.getFullPath());
        }        
    }
}