import {
    VTMNode,
    ParameterizedString,
    IMath,
    IMathObj,
    IParameterizedString,
    ValueSource,
    u
} from "../index";

import { create, all } from "mathjs"


/** Class that represents 'math' objects in a Virtual Thing Description. */
export class Math extends VTMNode {
    
    private expr: ParameterizedString = undefined;
    private conf: object = undefined;
    private scope: ValueSource = undefined;

    private readonly mathjs: any = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IMath){
        super(name, parent);

        if(u.instanceOf(jsonObj, Array) || u.instanceOf(jsonObj, String)){
            this.expr = new ParameterizedString("expr", this, jsonObj as IParameterizedString);
        }else{
            this.expr = new ParameterizedString("expr", this, (jsonObj as IMathObj).expr);
            this.conf = (jsonObj as IMathObj).conf;
            if((jsonObj as IMathObj).scope){
                this.scope = new ValueSource("scope", this, (jsonObj as IMathObj).scope);
            }
        }

        this.mathjs = create(all, this.conf);
    }

    /** Evaluates the expression and returns the result. */
    public async evaluate() {
        if(!this.expr){
            return undefined;
        }

        let expr = "";
        let scope = undefined;
        try{
            expr = this.expr.resolveAndGet();
            if(this.scope){
                scope = await this.scope.getValue();
                return this.mathjs.evaluate(expr, scope);
            }else{
                return this.mathjs.evaluate(expr);
            }            
        }catch(err){
            u.fatal("Evaluation failed: " + err.message
                + "\nOriginal expression: \"" + this.expr.getUnresolvedPath() + "\""
                + "\nResolved expression: \"" + expr + "\""
                + (scope ? "\nScope: " + JSON.stringify(scope) : ""), this.getFullPath());
        }
        return undefined;   
    }
}