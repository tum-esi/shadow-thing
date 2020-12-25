import {
    VTMNode,
    IParameterizedString,
    ParameterizedString,
    ReadOp,
    WriteOp,
    u
} from "../index";

import { readFileSync, writeFileSync, appendFileSync } from "fs";


/**
 * Class that represents the 'file' property of value source/target objects
 * in a Vritual Thing Description.
 */
export class File extends VTMNode {

    private path: ParameterizedString = undefined;

    public constructor(name: string, parent: VTMNode, jsonObj: IParameterizedString){
        super(name, parent);
        this.path = new ParameterizedString("path", this, jsonObj);
    }

    /**
     * Reads data from the file.
     * 
     * @param operation The read operation. If the operation
     * is 'length', the lenght of the content will be returned,
     * otherwise the content with 'utf-8' encoding.
     */
    public async read(operation: ReadOp){
        let promise = new Promise<string>(resolve => {
            resolve(readFileSync(this.path.resolveAndGet(), "utf-8"));
        });
        try{
            switch(operation){
                case ReadOp.length:
                    return (await promise).length;
                case ReadOp.parse:
                    return JSON.parse(await promise);
                default:
                    return await promise;
            }
        }catch(err){
            u.fatal("Failed to read file:\n" + err.message, this.getFullPath());
        }        
    }

    /**
     * Writes data to the file.
     * 
     * @param operation The write operation. 
     * If the operation is 'concat', 'push' or 'pushCopy', the data will be appended
     * to the file, else the data will overwrite the content of the file.
     * @param data The data to write.
     */
    public async write(operation: WriteOp, data: any){
        try{
            await new Promise<void>(resolve => {
                switch(operation){
                    case WriteOp.concat:
                    case WriteOp.push:
                    case WriteOp.pushCopy:
                        appendFileSync(this.path.resolveAndGet(), data, "utf-8");
                        break;
                    default:
                        writeFileSync(this.path.resolveAndGet(), data, "utf-8");
                        break;
                }
                resolve();
            });
        }catch(err){
            u.fatal("Failed to write file:\n" + err.message, this.getFullPath());
        }
    }
}