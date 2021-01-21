import {
    VTMNode,
    Pointer,
    WriteOp,
    WritableData,
    IValueTarget,
    File,
    u
} from "../index";


/** Class that represents a value target object in a Vritual Thing Description. */
export class ValueTarget extends VTMNode {    

    private pointer: Pointer = undefined;
    private file: File = undefined;
    private operation: WriteOp = WriteOp.set;

    public constructor(name: string, parent: VTMNode, jsonObj: IValueTarget){
        super(name, parent);

        if(jsonObj.pointer){
            this.pointer = new Pointer("pointer", this, jsonObj.pointer, [WritableData]);
        }else if(jsonObj.file){
            this.file = new File("file", this, jsonObj.file);
        }
        if(jsonObj.operation){
            this.operation = jsonObj.operation;
        }
    }

    public async setValue(value: any){
        try{
            if(this.pointer){            
                this.pointer.writeValue(value, this.operation);
            }else if(this.file){
                await this.file.write(this.operation, value);
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }            
    }
}