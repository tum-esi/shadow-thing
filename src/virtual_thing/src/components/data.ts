import * as jsonPointer from 'json-pointer';
import * as jsonInstantiator from 'json-schema-instantiator';

const jsf = require("json-schema-faker"); // TODO When JSON Faker v0.5.0 Stable is realeased, change this to TS import

import {
    IDataSchema,
    ComponentOwner,
    Component,
    u
} from "../index";

export enum ReadOp {
    get = "get",
    pop = "pop",
    copy = "copy",
    length = "length",
    parse = "parse"
}

export enum WriteOp {
    set = "set",
    push = "push",
    copy = "copy",
    pushCopy = "pushCopy",
    concat = "concat"
}

/** Base class for the instances of 'Component' that represent data, i.e. value. */
export abstract class DataHolder extends Component {
    
    protected data: any = undefined; // actual value
    private readonly schema: IDataSchema = undefined; // schema

    public constructor(name: string, parent: ComponentOwner, schema: IDataSchema){        
        super(name, parent);

        this.schema = schema;

        this.getModel().getValidator().addSchema(this.schema, this.getFullPath());

        this.reset();        
    }

    //#region Reset/initialize value

    /** Resets data to its default value according to the schema. */
    public reset(){        
        if(DataHolder.hasConst(this.schema)){
            this.data = this.schema.const;
        }else if(DataHolder.hasFakeTrue(this.schema)){
            this.fakeData();
        }else if(this.hasType()){
            this.data = jsonInstantiator.instantiate(this.schema); 
        }else if(this.hasDefault()){
            this.data = this.schema.default;
        }else{
            this.data = undefined;
        }
    }

    protected isFake(){
        return !DataHolder.hasConst(this.schema) && DataHolder.hasFakeTrue(this.schema);
    }

    protected hasDefault(){
        return this.schema.default !== undefined;
    }

    protected hasType(){
        return this.schema.type !== undefined;
    }

    public static hasFakeTrue(schema: IDataSchema){
        return schema.fake === true;
    }
    
    public static hasConst(schema: IDataSchema){
        return schema.const !== undefined;
    }

    public static isReadOnly(schema: IDataSchema){
        return DataHolder.hasConst(schema) || DataHolder.hasFakeTrue(schema);
    }

    //#endregion    

    /** Fakes data using the schema */
    protected fakeData(){
        this.data = jsf(this.schema);
    }    

    /**
     * Validates the given value against the schema.  
     * 
     * Returns true - if the value is valid, false - otherwise.
     * 
     * @param value Value to validate.
     * @param withError If true, then in case of validation failure an error
     * will be thrown.
     * @param opDescr A string descibing in which context validation is performed, e.g.
     * which operation required validation. Will be used in the message of the error
     * in case the latter is thrown.
     */
    protected validate(value: any, withError: boolean = false, opDescr: string = undefined): boolean {
        if(this.getModel().getValidator().validate(this.getFullPath(), value)){
            return true;
        }else if(withError){
            u.fatal("Validation failed: " + (opDescr ? "\n" + opDescr : "")
                + "\nReason: " + this.getModel().getValidator().errorsText(),
                this.getFullPath());
        }
        return false;
    }

    /**
     * Composes and returns a string describing an operation
     * that is being performed over data.
     * 
     * @param operation A valid read or write operation.
     * @param path The relative path of the affected entry in data.
     * @param value The value that is being written in case of a write operation.
     */
    protected getOperationString(operation: ReadOp|WriteOp, path: string, value: any = undefined){
        return "Operation: " + operation
                + (value !== undefined ? "\nValue: " + JSON.stringify(value, null, 4) : "")
                + "\nPath: " + (path === '' ? "root" : path);
    }

    /**
     * Checks whether data has an entry with the given path.  
     * 
     * Returns true - if check succeeds (i.e. an entry is present),
     * false - otherwise.
     * 
     * @param path The relative path of the entry in data.
     * @param expectedType The expected type of the entry. If this parameter
     * is provided and the entry is of a different type, the check will fail.
     * @param withError If true, then in case of check failure an error
     * will be thrown.
     * @param opDescr A string descibing in which context the check is performed, e.g.
     * which operation required this check. Will be used in the message of the error
     * in case the latter is thrown.
     */
    public hasEntry(path: string, expectedType: any = undefined, withError: boolean = false, opDescr: string = undefined): boolean {
        
        if(!jsonPointer.has(this.data, path)){

            if(withError){
                u.fatal("No such entry."
                        + (opDescr ? "\n" + opDescr : "")
                        + "\nData: \n"
                        + JSON.stringify(this.data, null, 4),
                        this.getFullPath());
            }
            return false;

        }else if(expectedType !== undefined){

            let value = jsonPointer.get(this.data, path);

            if(!u.instanceOf(value, expectedType)){
                if(withError){
                    u.fatal("Incorrect type."
                        + (opDescr ? "\n" + opDescr : "")
                        + "\nExpected type: "
                        + u.getTypeNameFromType(expectedType)
                        + "\nActual type: "
                        + u.getTypeNameFromValue(value),
                        this.getFullPath());
                }
                return false;
            }            
        }
        return true;
    }

    /**
     * Creates and returns an instance of:
     * - 'ReadOnlyData' in case the given schema contains 'const' or 'fake'
     * - 'Data' - otherwise
     * 
     * @param name A name for the instance (name of the node).
     * @param parent A parent for the instance (parent node)
     * @param schema A valid schema object.
     */
    public static getInstance(name: string, parent: ComponentOwner, schema: IDataSchema): DataHolder {
        if(this.isReadOnly(schema)){
            return new ReadOnlyData(name, parent, schema);
        }else{
            return new Data(name, parent, schema);
        }
    }
}

/** Base class for the instances of 'DataHolder' that can be read. */
export abstract class ReadableData extends DataHolder {

    /**
     * Performs the given read operation from the given path in data
     * and returns the result if successful, throws an error otherwise.  
     * 
     * An error may be thrown in the following cases:
     * - an entry under the given path does not exist
     * - the given operation will lead to incompliance with the schema
     * - the given operation is not allowed on the addressed entry in data
     * - the given operation is invalid
     * - other internal errors happen
     * 
     * @param operation A valid read operation. Allowed read operations
     * depend on the type of the entry addressed by the parameter 'path'.
     * @param path A path to an existing entry in data.
     */
    public read(operation: ReadOp, path: string = ""){

        /**
         * In case a read operation may lead to changes in data (e.g. 'pop'),
         * the operation will be first performed on a copy of data, then the 
         * copy will be validated. If the copy passes validation, then the
         * operation will be performed on the original data,
         * otherwise an error will be thrown.
         */

        // Fake instances generate new fake value on each read.
        if(this.isFake()){
            this.reset();
        }
        
        let opStr = this.getOperationString(operation, path);

        switch(operation){

            // return reference if object, value if primitive
            case ReadOp.get:
                // Check if the entry exists
                if(this.hasEntry(path, undefined, true, opStr)){
                    return jsonPointer.get(this.data, path);
                }                

            // return a deep copy
            case ReadOp.copy:
                // Check if the entry exists
                if(this.hasEntry(path, undefined, true, opStr)){
                    return u.copy(jsonPointer.get(this.data, path));
                }                
            
            // pop from array and return
            case ReadOp.pop:
                // the 'pop' operation on a readonly data is not allowed
                if(this instanceof ReadOnlyData){
                    u.fatal("Invalid operation on a constant:\n" + opStr, this.getFullPath());
                }
                // Check if the entry exists and it is an array
                if(this.hasEntry(path, Array, true, opStr)){                    
                    let copy = u.copy(this.data);
                    jsonPointer.get(copy, path).pop();                    
                    // validate the copy with an error if invaild
                    if(this.validate(copy, true, opStr)){
                        // modify original data after successful validation
                        return jsonPointer.get(this.data, path).pop();
                    }                    
                }

            // return length of an array or string
            case ReadOp.length:
                // Check if the entry exists and it is an array or a string
                if(this.hasEntry(path, Array, false, opStr)
                    || this.hasEntry(path, String, true, opStr)){
                    return jsonPointer.get(this.data, path).length;
                }

            // return value parsed from a string
            case ReadOp.parse:
                // Check if the entry exists and it is a string
                if(this.hasEntry(path, String, true, opStr)){
                    return JSON.parse(jsonPointer.get(this.data, path));
                }
        }
        u.fatal("Invalid operation:\n" + opStr, this.getFullPath());
    }
}

/** Base class for the instances of 'ReadableData' that can also be written. */
export abstract class WritableData extends ReadableData {
   
    private isRootPath(path: string): boolean {
        return !path || path.trim().length == 0;
    }

    public fake(){
        this.fakeData();
    }

    /**
     * Performs the given write operation to the entry with the given
     * path in data if successful, throws an error otherwise.  
     * 
     * An error may be thrown in the following cases:
     * - an entry under the given path does not exist
     * - the given operation will lead to incompliance with the schema
     * - the given operation is not allowed on the addressed entry in data
     * - the given operation is invalid
     * - other internal errors happen
     * 
     * @param operation A valid read operation. Allowed read operations
     * depend on the type of the entry addressed by the parameter 'path'.
     * @param path A path to an existing entry in data.
     */
    public write(operation: WriteOp, value: any, path: string = ""){

        /**
         * The operation will be first performed on a copy of data, then the 
         * copy will be validated. If the copy passes validation, then the
         * operation will be performed on the original data,
         * otherwise an error will be thrown.
         */
        
        let copy: any = undefined;
        let opStr = this.getOperationString(operation, path, value);

        switch(operation){

            // set reference if object, value if primitive
            case WriteOp.set:

                // Check if the entry exists
                if(this.hasEntry(path, undefined, true, opStr)){

                    // perform operation on a copy of data
                    copy = u.copy(this.data);
                    if(this.isRootPath(path)){
                        copy = value;                        
                    }else{
                        jsonPointer.set(copy, path, value);
                    } 

                    // validate the copy with an error if invaild
                    if(this.validate(copy, true, opStr)){

                        // modify original data after successful validation
                        if(this.isRootPath(path)){                            
                            this.data = value;
                        }else{
                            jsonPointer.set(this.data, path, value);                            
                        }
                    }
                }    
                break;

            // write a deep copy
            case WriteOp.copy:

                // Check if the entry exists
                if(this.hasEntry(path, undefined, true, opStr)){

                    // perform operation on a copy of data
                    copy = u.copy(this.data);
                    if(this.isRootPath(path)){
                        copy = value;
                    }else{
                        jsonPointer.set(copy, path, value);
                    } 

                    // validate the copy with an error if invaild
                    if(this.validate(copy, true, opStr)){

                        // modify original data after successful validation
                        if(this.isRootPath(path)){                            
                            this.data = u.copy(value);
                        }else{
                            jsonPointer.set(this.data, path, u.copy(value));
                        }                        
                    }
                }    
                break;

            // push the reference if object, value if primitive
            case WriteOp.push:

                // Check if the entry exists and it is an array
                if(this.hasEntry(path, Array, true, opStr)){

                    // perform operation on a copy of data
                    copy = u.copy(this.data);
                    jsonPointer.get(copy, path).push(value); 

                    // validate the copy with an error if invaild
                    if(this.validate(copy, true, opStr)){

                        // modify original data after successful validation
                        jsonPointer.get(this.data, path).push(value);
                    }
                }
                break;

            // push a deep copy
            case WriteOp.pushCopy:

                // Check if the entry exists and it is an array
                if(this.hasEntry(path, Array, true, opStr)){

                    // perform operation on a copy of data
                    copy = u.copy(this.data);
                    jsonPointer.get(copy, path).push(value); 

                    // validate the copy with an error if invaild
                    if(this.validate(copy, true, opStr)){

                        // modify original data after successful validation
                        jsonPointer.get(this.data, path).push(u.copy(value));
                    }
                }    
                break;

            // concatenate to a string
            case WriteOp.concat:

                // Check if the entry exists and it is a string
                if(this.hasEntry(path, String, true, opStr)){

                    // perform operation on a copy of data
                    copy = u.copy(this.data);
                    let targetValue = jsonPointer.get(copy, path) + value;
                    if(this.isRootPath(path)){
                        copy = targetValue;
                    }else{
                        jsonPointer.set(copy, path, targetValue);
                    } 

                    // validate the copy with an error if invaild
                    if(this.validate(copy, true, opStr)){ 
                        
                        // modify original data after successful validation
                        if(this.isRootPath(path)){                        
                            this.data = targetValue;
                        }else{    
                            jsonPointer.set(this.data, path, targetValue);
                        }
                    }
                }    
                break;
            default:
                u.fatal("Invalid operation:\n" + opStr, this.getFullPath());
                break;
        }        
    }
}

/** Class representing readonly data. */
export class ReadOnlyData extends ReadableData {
    public constructor(name: string, parent: ComponentOwner, schema: IDataSchema){        
        super(name, parent, schema);        
    }
}

/** Class representing read/write-able data. */
export class Data extends WritableData {
    public constructor(name: string, parent: ComponentOwner, schema: IDataSchema){        
        super(name, parent, schema);        
    }
}