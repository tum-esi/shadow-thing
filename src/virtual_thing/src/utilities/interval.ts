import {
    VTMNode,
    Math,
    Trigger,
    IMath,
    u
} from "../index";


/** Class that represents 'interval' properties in a Virtual Thing Description */
export class Interval extends VTMNode {

    // Indicates whether this interval should periodically invoke the attached trigger
    private periodicTriggerMode: boolean = false;
    // The trigger to be invoked in 'periodic trigger mode'
    private trigger: Trigger = undefined;
    
    // Source of interval length (delay duration) in ms
    private math: Math = undefined;

    private started: boolean = false;

    //#region auxiliary properties
    private lastInterval: number = 0;
    private lastTs: number = 0;
    //#endregion

    /**
     * Creates an instance of interval.
     * 
     * @param name 
     * @param parent 
     * @param jsonObj 
     * @param periodicTriggerMode If this property is true,
     * the interval will run in periodic mode and invoke
     * the attached 'Trigger' object on each tick. The trigger
     * object needs to be attached using the dedicated function.
     */
    public constructor(name: string, parent: VTMNode, jsonObj: IMath, periodicTriggerMode: boolean = false){
        super(name, parent);

        this.periodicTriggerMode = periodicTriggerMode;
        this.math = new Math("math", this, jsonObj);       

        if(this.periodicTriggerMode){
            this.getModel().registerPeriodicInterval(this);
        }
    }
        
    /**
     * Starts the loop that invokes the attached trigger periodically.
     * Performs in a best-effort manner: if the interval is too short
     * to complete the trigger's routine (process, instructions, etc.),
     * then the next invokation of the trigger will happen at the first
     * opportunity (after the previous invokation completes). In other
     * words, the actual invokation interval (or frequency) is not guaranteed.
     */
    private async runPeriodicTrigger(){
        try{
            while(this.started){
                await this.nextTick();           
                if(this.trigger){
                    await this.trigger.invoke();
                }
            }                        
        }catch(err){
            u.modelFailure(err.message, this);
        }
    }

    private async nextTick() {        
        
        /**
         * Get the value of the required interval. Since the interval expression
         * may contain dynamic string parameters, it has to be re-evaluated at each tick
         */ 
        let interval = await this.math.evaluate();
        if(!interval || interval < 0){
            u.fatal(`Invalid interval: ${interval}.`, this.getFullPath());
        }

        /**
         * If the value of the required changed since the last tick,
         * the timer is reset to start over using the new interval value.
         */
        if(interval != this.lastInterval){
            this.lastInterval = interval;
            this.reset();
        }

        /**
         * To achieve the best possible synchronization with 'ideal' tick timestamps
         * and remove additive error, the delay value of 'setTimeout()' is calculated
         * as the difference of the next tick's ideal timestamp and current time.
         */
        let nextTs = this.lastTs + interval;
        let needDelay = nextTs - Date.now();

        if(needDelay > 0){
            try{
                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        this.lastTs = nextTs;
                        resolve();
                    }, needDelay);
                });   
            }catch(err){
                throw err;
            }            
        }else{
            this.lastTs = nextTs;
        }             
    }

    /**
     * Sets a trigger object that should be invoked periodically
     * in case the interval is in periodic mode.
     * 
     * @param trigger 
     */
    public setTrigger(trigger: Trigger){
        this.trigger = trigger;
    }

    /**
     * Waits for the next tick and returns. This method cannot be
     * used in case the interval object is set up to operate in
     * periodic mode autonomously.
     */
    public async waitForNextTick(){
        if(this.periodicTriggerMode){
            u.fatal("Can't explicitely call waitForNextTick() in \"perdiodicTriggerMode\".", this.getFullPath());
        }else if(!this.started){
            u.fatal("Interval is not started.", this.getFullPath());
        }
        try{
            await this.nextTick();
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }   
    }    

    /**
     * Starts operation. If the interval is configured to operate
     * in periodic mode, this function will start the timer.
     */
    public start(){        
        if(this.started){
            return;
        }
        this.started = true;
        this.reset();
        if(this.periodicTriggerMode){
            this.runPeriodicTrigger();
        }
    }

    /**
     * Resets the timer. Resetting means setting the 'reference timestamp'
     * (start timestamp) to current time.
     */
    public reset(){
        this.lastTs = Date.now();
    }

    public stop(){
        this.started = false;
    }

    public isStarted(): boolean {
        return this.started;
    }
}