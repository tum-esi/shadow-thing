import {
    VTMNode,
    ReadOp,
    Pointer,
    u,
    IParameterizedString
} from "../index";


/**
 * Class represents a string or string array that may contain
 * dynamic parameters that will be resolved in runtime.
 * */
export class ParameterizedString extends VTMNode {

    // For "In string" parameters, e.g. "${path/to/value}"
    private readonly inStringParamRegExp: RegExp = /(\$p?[1-9]?\{)([^${}]+)(\})/g;
    private readonly prettyRegExp: RegExp = /^\$p[1-9]?\{/;
    private readonly indentationRegExp: RegExp = /^\$p([1-9])\{/;

    // For "Copy value" parameters, e.g. "{'copy':'path/to/value'}"
    private readonly compoundDataCopyValueRegExp: RegExp = /(\s*\{\s*"copy"\s*:\s*")([^${}]+)("\s*\})/g;

    private readonly readOpRegexp: RegExp = /^(length|copy|pop|get|parse)(:)(.*)/;

    private hasParams: boolean = undefined;
    private unresolvedString: string = undefined;

    private forCompound: boolean = undefined;

    /**
     * Instantiates a ParameterizedString.
     * @param name 
     * @param parent 
     * @param jsonObj 
     * @param forCompound If true, resolution will be performed
     * against all parameter types, else - only against
     * parameters of the form '${path/to/smth}'
     */
    public constructor(name: string, parent: VTMNode, jsonObj: IParameterizedString, forCompound: boolean = false){        
        super(name, parent);
        this.unresolvedString = this.join(jsonObj);
        this.forCompound = forCompound;
        this.hasParams = this.hasDynamicParams();
    }

    private join(value: IParameterizedString){
        if(Array.isArray(value)){
            return value ? value.join("") : "";
        }else{
            return value;
        }        
    }

    private hasReadOp(str: string): boolean {
        return str.match(this.readOpRegexp) != undefined;
    }

    private getReadOp(str: string): ReadOp {
        if(this.hasReadOp(str)){
            return str.replace(this.readOpRegexp, "$1") as ReadOp;
        }else{
            return ReadOp.get;
        }
    }

    private removeReadOp(str: string): string {
        if(this.hasReadOp(str)){
            return str.replace(this.readOpRegexp, "$3");
        }else{
            return str;
        }
    }    

    private hasPretty(str: string): boolean {
        return str.match(this.prettyRegExp) != undefined;
    }

    private getIndentation(str: string): number {
        if(str.match(this.indentationRegExp) != undefined){
            return Number.parseInt(str.replace(this.indentationRegExp, "$1"));
        }else{
            return 2;
        }
    }

    /**
     * Resolves dynamic parameters of the given type defined by the 'paramRegExp'
     * and returns a resolved string.
     * 
     * @param str A string with valid or no parameters.
     * @param paramRegExp A RegExp to match parameters in the given string.
     * @param replace The position of the group in the 'paramRegExp' (e.g. "$2") which contains
     * the 'path' component.
     */
    private resolveForRegExp(str: string, paramRegExp: RegExp, replace: string): string {
        
        let paramPathWithReadOp = undefined;
        let paramVal = undefined;
        let params = str.match(paramRegExp);

        while(params){
            for (const paramStr of params){
                
                paramPathWithReadOp = paramStr.replace(paramRegExp, replace);     
                
                paramVal = new Pointer(undefined, this, [this.removeReadOp(paramPathWithReadOp)], undefined, false)
                                    .readValue(this.getReadOp(paramPathWithReadOp));
             
                /** 
                 * If current regexp == inStringParamRegExp and paramVal is already a string
                 * then do not stringify it additionally. In all other cases stringify.    
                */
                if(paramRegExp != this.inStringParamRegExp || !u.instanceOf(paramVal, String)){                    
                    if(paramRegExp == this.inStringParamRegExp && this.hasPretty(paramStr)){
                        /** If has pretty params, then stringify prettily */
                        paramVal = JSON.stringify(paramVal, undefined, this.getIndentation(paramStr));
                    }else{
                        paramVal = JSON.stringify(paramVal);   
                    }                    
                }
                str = str.replace(paramStr, paramVal);
            }
            params = str.match(paramRegExp);
        }
        return str;
    }

    /**
     * Resolves the dynamic parameters returns a resolved string.
     */
    public resolveAndGet(): string {  
        let resolvedString = this.unresolvedString; 
        if(this.hasParams){
            resolvedString = this.resolveForRegExp(this.unresolvedString, this.inStringParamRegExp, "$2");
            if(this.forCompound){
                resolvedString = this.resolveForRegExp(resolvedString, this.compoundDataCopyValueRegExp, "$2");
            }
        }        
        return resolvedString;
    }

    /**
     * Returns the original path string.
     */
    public getUnresolvedPath(): string {
        return this.unresolvedString;
    }

    public hasDynamicParams(): boolean {
        if(this.unresolvedString){
            if(this.forCompound){
                return this.unresolvedString.match(this.inStringParamRegExp) != undefined
                    || this.unresolvedString.match(this.compoundDataCopyValueRegExp) != undefined;
            }else{
                return this.unresolvedString.match(this.inStringParamRegExp) != undefined;
            }
            
        }else{
            return false;
        }
    }
}