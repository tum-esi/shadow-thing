import {
    Loop,
    Process,
    TryCatch,
    VirtualThingModel,
    Behavior,
    u
} from "../index";


/** Virtual Thing Model Node - base class for nodes of a Virtual Thing Model. */
export abstract class VTMNode {

    private parent: VTMNode = undefined;
    private name: string = undefined;


    public constructor(name: string, parent: VTMNode){
        this.setParent(parent);
        this.setName(name);

        /**
         * Log creation of this object if it has a name.
         * 
         * Objects with no name are not permanent nodes of the Model tree,
         * they are created temporarily, and sometimes can be created
         * too often and hence, flud the console. Example of such an object:
         * a Pointer that is created during resolution of a parameterized
         * string. Such a pointer will be created each time a dynamic string
         * parameter is resolved. This may happen very often depending on
         * the Virtual Thing Description.
         */
        if(this instanceof VirtualThingModel || this.getName()){
            u.info(u.getTypeNameFromValue(this), this.getFullPath());
        }
    }

    public getName(): string {
        return this.name;
    }

    /** Returns the path, which is relative to the parent. */
    public getRelativePath(): string {
        return this.name;
    }

    /** Returns the full path starting from the root. */
    public getFullPath(): string {
        return (this.parent ? this.parent.getFullPath() : "") +
                (this.name ? "/" + this.name : "");
    }

    public getParent(): VTMNode {
        return this.parent;
    }

    /**
     * Returns:
     * - the first instance of 'Loop' on the path
     * towards the root - if such instance exists
     * - undefined - otherwise.
     */
    public getParentLoop(): Loop {
        return this.getFirstParentOfType(Loop);
    }

    /**
     * Returns:
     * - the first instance of 'TryCatch' on the path
     * towards the root - if such instance exists
     * - undefined - otherwise.
     */
    public getParentTry(): TryCatch {
        return this.getFirstParentOfType(TryCatch);
    }

    /** Returns the first instance of 'Behavior' on the path towards the root. */
    public getBehavior(): Behavior {
        return this.getFirstParentOfType(Behavior);
    }

    /**
     * Returns:
     * - the first (and only possible) instance of 'Process' on the path
     * towards the root - if such instance exists
     * - undefined - otherwise.
     */
    public getProcess(): Process {
        return this.getFirstParentOfType(Process);
    }

    /** Returns the root node - an instance of 'VirtualThingModel'. */
    public getModel(): VirtualThingModel {
        return this.getFirstParentOfType(VirtualThingModel);
    }
    
    /**
     * Returns:
     * - the first instance of the given type on the path towards
     * the root - if such instance exists
     * - undefined - otherwise.
     * 
     * @param type Type (class) of the required node. Must be a class that extends
     * the class 'VTMNode'.
     */
    private getFirstParentOfType(type: any) {
        if(u.instanceOf(this, type)){
            return this;
        }else if(this.getParent()){
            return this.getParent().getFirstParentOfType(type);
        }else{
            return undefined;
        }
    }

    /**
     * Sets the parent node of this node.
     * Throws an error in the following cases:
     * - called on an  instance of 'VirtualThingModel'
     * - 'parent' is not an instance of 'VTMNode'
     * - setting 'parent' results in a loop.
     * 
     * @param parent Parent node.
     */
    public setParent(parent: VTMNode){
        if(this instanceof VirtualThingModel){
            if(parent != undefined){
                u.fatal("An instance of the VirtualThingModel class must"
                + " be the root node (cannot have a parent).", this.getFullPath());
            }
            return;            
        }else if(!(parent instanceof VTMNode)){
            u.fatal("The parent must be an instance of the VTMNode class.", this.getFullPath());
        }else{
            this.parent = parent;
            let node: VTMNode = this;
            while(node){
                node = node.getParent();
                if(node === this){
                    u.fatal("No loops are allowed in the tree.", this.getName());
                }
            }            
        }     
    }

    public setName(name: string){
        this.name = name;
    }

    protected reportFunctionCall(name: string){
        u.info(u.getTypeNameFromValue(this) + "." + name, this.getFullPath());
    }
}

