import {
    VTMNode,
    Pointer,
    CompoundData,
    Math,
    ReadOp,
    ReadableData,
    File,
    IValueSource,
    u
} from "../index";


/** Class that represents a value source object in a Vritual Thing Description. */
export class ValueSource extends VTMNode {    

    private math: Math = undefined;
    private compound: CompoundData = undefined;
    private pointer: Pointer = undefined;
    private file: File = undefined;
    private operation: ReadOp = ReadOp.get;

    public constructor(name: string, parent: VTMNode, jsonObj: IValueSource){
        super(name, parent);
        
        if(jsonObj.math){
            this.math = new Math("math", this, jsonObj.math);
        }else if(jsonObj.compound !== undefined){
            this.compound = new CompoundData("compound", this, jsonObj.compound);
        }else if(jsonObj.file){
            this.file = new File("file", this, jsonObj.file);
        }else if(jsonObj.pointer){
            this.pointer = new Pointer("pointer", this, jsonObj.pointer, [ReadableData]);
        }

        if(jsonObj.operation){
            this.operation = jsonObj.operation;
        }      
    }
    
    public async getValue() {
        try{
            if(this.math){
                return await this.math.evaluate();
            }else if(this.compound){
                return this.compound.getValue();
            }else if(this.file){
                return await this.file.read(this.operation);                
            }else if(this.pointer){
                return this.pointer.readValue(this.operation);
            }else{
                return undefined;
            }
        }catch(err){
            u.fatal(err.message, this.getFullPath());
        }        
        return undefined;
    }
}