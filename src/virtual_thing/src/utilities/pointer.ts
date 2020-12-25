import * as jsonPointer from 'json-pointer';

import {
    VTMNode,
    ComponentOwner,
    DataHolder,
    Data,
    ReadableData,
    WritableData,
    ReadOp,
    WriteOp,
    DateTime,
    ParameterizedString,
    IPointer,
    ComponentType,
    TryCatch,
    u,
    ReadOnlyData
} from "../index";


/**
 * Class that represents the pointer instances in a Virtual Thing Description.  
 * The pointer instances can be not only the values of properties that 
 * have pointer type, but also dynamic parameters of parameterized string instances.
 */
export class Pointer extends VTMNode {

    //#region Properties and constructors
    private expectedTypes: any[] = undefined;
    
    private path: ParameterizedString = undefined;

    // The node to which the 'base' part of the pointer is pointing
    private targetNode: VTMNode = undefined;
    
    // The 'relative' part of the pointer
    private relativePathInTargetNode: string = "";

    /**
     * 'resolvedOnce' is used to avoid unnecessary repeated resolution where possible.
     * If the 'path' contains dynamic parameters,
     * then the 'resolvedOnce' will have no effect.
     */ 
    private resolvedOnce: boolean = false;

    // A tocken to access the instance of 'Process' in whose scope the pointer is
    private readonly processTocken = ".";

    // A tocken to access the instance of 'Behavior' in whose scope the pointer is
    private readonly behaviorTocken = "..";

    // A tocken to access the full path of the pointer self
    private readonly pathTocken: string = "path";
    private readonly procPathTocken: string = "processPath";
    private readonly behaviorPathTocken: string = "behaviorPath";
    private readonly modelPathTocken: string = "modelPath";
    
    
    /**
     * Creates an instance of 'Pointer'.
     * 
     * @param name 
     * @param parent 
     * @param jsonObj A valid pointer string or a parameterized string that will
     * resolve to a valid pointer string, e.g.:
     * - "path/to/something"
     * - "${path/to/a/valid/pointer/string}"
     * - "path/to/array/${path/to/index}"
     * - etc.  
     * 
     * A valid pointer string consists of 2 parts: 'base' and 'relative'.
     * The 'base' part points to a node in the Model, the 'relative' part is
     * a relative path within that node. Example:
     * - "path/to/a/dataHolderNode/path/to/a/specific/property":  
     * 'base': path/to/a/dataHolderNode  
     * 'relative': path/to/a/specific/property
     * - "dt/unix":  
     * 'base': "dt" (a new DateTime node)  
     * 'relative': "unix" (get unix time)
     * - "processes/someProcess/dataMap/someData":  
     * 'base': "processes/someProcess/dataMap/someData" (points to the last node - someData)
     * 'relative': no relative path
     * - etc.
     * 
     * @param expectedTypes An array of types against which the pointer should be validated.
     * @param validateOnModelStart Indicates whether the pointer should be validated
     * on model start.
     */
    public constructor(name: string, parent: VTMNode, jsonObj: IPointer,
                        expectedTypes: any[],
                        validateOnModelStart: boolean = true){

        super(name, parent);
        
        this.expectedTypes = expectedTypes;
        this.path = new ParameterizedString(undefined, this, jsonObj);

        /**
         * If the pointer needs to be validated on Model start, the register
         * the pointer by the Model. The Model will then 'init()' the 
         * pointer, which in turn will lead to validation.
         */
        if(validateOnModelStart){
            this.getModel().registerPointer(this);
        }
    }
    //#endregion

    //#region Resolution

    /**
     * Initializes (resolves and validates) the pointer.
     * Should be called after all the addressable objects of the model are created.  
     * 
     * Initialization is not mandatory since the pointer will be initialized anyways at each
     * reference to it during the Model's runtime. Initialization can be used e.g. to validate
     * the pointer before the Model starts in case validity of the pointer is vital for the Model.  
     * 
     * Initialization by this function will not happen if the pointer contains dynamic parameters.
     */
    public init(){
        if(this.path.hasDynamicParams()){
            this.warning("Can't initialize a pointer that contains dynamic parameters");
            return;
        }
        try{
            this.resolve();
        }catch(err){
            this.fatal(err.message);
        }        
    }

    /**
     * Resolves the pointer string to retrieve the 'targetNode' from the
     * 'base' part of the pointer string and the 'relativePathInTargetNode' 
     * from the relative part.
     */
    private resolve() {        
        if(!this.path.hasDynamicParams() && this.resolvedOnce){            
            /**
             * Avoid redundant resolution if the pointer does not contain
             * dynamic parameters and was resolved earlier.
             */
            return;            
        }
        try{
            this.retrieveTargetNode();            
            this.resolvedOnce = true;
            this.validate();
        }catch(err){
            u.fatal(err.message);
        }        
    }
    
    /** Finds the target node to which the 'base' part of the pointer is pointing. */
    private retrieveTargetNode(){
        
        let pathStr = this.path.resolveAndGet();
        if(!pathStr.startsWith("/")){
            pathStr = "/" + pathStr;
        }

        // If pointer targets a DateTime value
        if(DateTime.isDTExpr(pathStr)){    
            if(!DateTime.isValidDTExpr(pathStr)){
                u.fatal("Invalid DateTime format: " + pathStr);
            }        
            this.targetNode = new DateTime(this);
            this.relativePathInTargetNode = pathStr;
            return;
        }

        // If pointer targets an error message of a 'TryCatch' block (if any) in whose scope the pointer is.
        if(TryCatch.isErrorMessageTocken(pathStr)){
            this.targetNode = this.getParentTry();
            if(!this.targetNode){
                u.fatal("No parent \"TryCatch\" instruction found");
            }
            return;
        }
      
        const tokens: string[] = jsonPointer.parse(pathStr);

        if(!tokens || tokens.length == 0){
            u.fatal("Invalid pointer.");
        }

        // If the first tocken targets properties related to the pointer self
        if(tokens[0] == this.pathTocken
            || tokens[0] == this.procPathTocken
            || tokens[0] == this.behaviorPathTocken
            || tokens[0] == this.modelPathTocken){
            this.targetNode = this;
            this.relativePathInTargetNode = tokens[0];
            return;
        }

        let relativePathStartIndex = 1;

        // If the first tocken targets the parent process
        if(tokens[0] == this.processTocken){            
            this.targetNode = this.getProcess();
        
        // If the first tocken targets the parent behavior (e.g. inter. afford.)
        }else if(tokens[0] == this.behaviorTocken){
            this.targetNode = this.getBehavior();

        // Else the first tocken should target a child component of the Model
        }else{

            this.targetNode = this.getModel().getChildComponent(tokens[0] as ComponentType);
        }
        
        // resolve the rest of the tockens iteratively
        while(relativePathStartIndex < tokens.length){

            /**
             * If targetNode has reached an instance of 'ComponentOwner',
             * then the next tocket must be its child component
             */
            if(this.targetNode instanceof ComponentOwner){
                this.targetNode = this.targetNode.getChildComponent(tokens[relativePathStartIndex] as ComponentType);

            /**
             * If targetNode has reached an instance of 'DataHolder',
             * there can be no further node, hence the rest of the tockens,
             * if present, must be the relative path
             */
            }else if(this.targetNode instanceof DataHolder){
                break;
            }
            relativePathStartIndex++;
        }
        this.retrieveRelativePathInTargetNode(tokens, relativePathStartIndex);
    }

    /**
     * Retrieves the 'relative' part of the pointer.
     * 
     * @param tokens The pointer tockens
     * @param startIndex The index of the tocken from which the 'relaitve'
     * part of the pointer starts.
     */
    private retrieveRelativePathInTargetNode(tokens: string[], startIndex: number) {
        if(!tokens
            || tokens.length == 0
            || startIndex < 0
            || tokens.length < startIndex - 1){
                
            this.relativePathInTargetNode = "";
        }else{
            this.relativePathInTargetNode = jsonPointer.compile(tokens.slice(startIndex, tokens.length));
        }        
    }

    private getTargetNode(resolve: boolean): any {
        if(resolve){
            this.resolve();
        }        
        return this.targetNode;
    }
    
    private getRelativePathInTargetNode(resolve: boolean): string {
        if(resolve){
            this.resolve();
        }
        return this.relativePathInTargetNode;
    }

    private getOwnProperty(tocken: string){
        switch(tocken){
            case this.pathTocken:
                return this.getFullPath();
            case this.procPathTocken:
                return this.getProcess().getFullPath();
            case this.behaviorPathTocken:
                return this.getBehavior() ? this.getBehavior().getFullPath() : undefined;
            case this.modelPathTocken:
                return this.getModel().getFullPath();
            default:
                return undefined;
        }
    }
    //#endregion

    //#region Access

    /**
     * Performs the given read operation on the target node
     * and returns the value/
     * 
     * @param operation 
     */
    public readValue(operation: ReadOp = ReadOp.get): any {
        try{
            this.resolve();
            if(this.targetNode === this){
                return this.getOwnProperty(this.relativePathInTargetNode);        
            }else if(this.targetNode instanceof DateTime){
                return this.targetNode.get(this.relativePathInTargetNode);
            }else if(this.targetNode instanceof TryCatch){
                return this.targetNode.getErrorMessage();
            }else if(this.targetNode instanceof ReadableData){
                return this.targetNode.read(operation, this.relativePathInTargetNode);
            }else{
                return this.getTargetNode(false);
            }
        }catch(err){
            this.fatal("Couldn't read value:\n" + err.message);
        }
    }

    /**
     * Writes a fake value to the target node in case
     * the latter is an instance of 'WritableData',
     * throws an error otherwise.
     * The value is generated according to the schema of the
     * target node.
     */
    public fakeValue(){
        try{
            this.resolve();

            if(this.targetNode instanceof WritableData){
                this.targetNode.fake();
            }else{
                u.fatal('Target component is not a "writable data".');
            }
        }catch(err){
            this.fatal("Couldn't write value:\n" + err.message);
        }
    }

    /**
     * Writes the given value to the target node using the 
     * given write operation in case the target node is an instance
     * of 'WritableData', throws an error otherwise.
     * @param value 
     * @param operation 
     */
    public writeValue(value: any, operation: WriteOp = WriteOp.set){
        try{
            this.resolve();

            if(this.targetNode instanceof WritableData){
                this.targetNode.write(operation, value, this.relativePathInTargetNode);   
            }else{
                u.fatal('Target component is not a "writable data".');
            }
        }catch(err){
            this.fatal("Couldn't write value:\n" + err.message);
        }        
    }
    //#endregion

    //#region Validation and messages

    /**
     * Validates the type of the 'targetNode' and, if applicable, the value pointed to
     * by the 'relativePathInTargetNode' against the 'expectedTypes', if any.  
     * 
     * Throws an error in case validation fails.
     */
    private validate(){
        
        if(!this.expectedTypes || this.expectedTypes.length == 0){
            return;
        }

        try{
            let validated = true;
            let reason = undefined;

            for(const type of this.expectedTypes){
                switch(type){

                    /**
                     * If the expected type is a 'DataHolder' and its derived types, then:
                     * - the 'targetNode' must be an instance of 'DataHolder'
                     * - the 'relativePathInTargetNode' must point to an existing
                     *   entry in that 'DataHolder'
                     */
                    case DataHolder:
                    case ReadableData:
                    case WritableData:
                    case Data:
                    case ReadOnlyData:
                        if(!u.instanceOf(this.getTargetNode(false), type)){
                            validated = false;
                            reason = "wrong data type";
                        }else if(!(this.getTargetNode(false) as DataHolder).hasEntry(this.getRelativePathInTargetNode(false))){
                            validated = false;
                            reason = "no such entry: \"" + this.getRelativePathInTargetNode(false) + "\"";
                        }
                        break;
                    
                    /**
                     * If the expected type is one of default value types, then:
                     * - the 'targetNode' must be an instance of 'DataHolder'
                     * - the 'relativePathInTargetNode' must point to an existing
                     *   entry in that 'DataHolder'
                     * - the entry of the 'DataHolder' pointed to by the 'relativePathInTargetNode'
                     *   must have the expected type.
                     */
                    case null:
                    case Number:
                    case Boolean:
                    case String:                        
                    case Array:
                    case Object:
                        if(!u.instanceOf(this.getTargetNode(false), DataHolder)){
                            validated = false;
                            reason = "wrong data type"
                        }else if(!(this.getTargetNode(false) as DataHolder).hasEntry(this.getRelativePathInTargetNode(false), type)){
                            validated = false;
                            reason = "no entry \"" + this.getRelativePathInTargetNode(false) + "\" with type \"" + u.getTypeNameFromType(type) + "\"";
                        }
                        break;

                    /**
                     * In all other cases the 'targetNode' must be an instance
                     * of the expected type.
                     */
                    default:
                        if(!u.instanceOf(this.getTargetNode(false), type)){
                            validated = false;
                            reason = "wrong data type";
                        }
                }

                if(!validated){
                    break;
                }
            }

            if(!validated){
                u.fatal("Validation failed: " + reason);
            }  
        }catch(err){
            u.fatal(err.message);
        }
    }
   
    /** Composes and returns a description message for the pointer. */
    private getInfo(): string {
        let info = "Pointer info:\noriginal path: " + this.path.getUnresolvedPath()
                    + "\nresolved path: " + this.path.resolveAndGet()
                    + "\nexpected types: ";
        if(!this.expectedTypes || this.expectedTypes.length == 0){
            info += "unknown";
        }else{
            for(const type of this.expectedTypes){
                info += u.getTypeNameFromType(type) + " ";
            }
        }
        if(this.resolvedOnce){
            info = info
                + "\nactual component type: " + u.getTypeNameFromValue(this.targetNode);
                + "\nrelative path: " + this.relativePathInTargetNode;
        }else{
            info += "\nresolved: false";
        }
        return info;
    }

    private fatal(message: string = "Invalid pointer."){
        let mes = message + ":\n" + this.getInfo();
        u.fatal(mes, this.getFullPath());
    }
    
    private warning(message: string){
        let mes = message + ":\n" + this.getInfo();
        u.warn(mes, this.getFullPath());
    }
        
    //#endregion
}
