import {
    VTMNode,
    IBehavior,
    ComponentFactory,
    u
} from "../index";


/**
 * Values in this enum define the allowed pointer tockens
 * that can be used in Virtual Thing Description to address
 * their respective instances of 'Component'.
 */
export enum ComponentType {
    Model = "",
    Property = "p",
    Action = "a",
    Event = "e",
    Sensor = "sen",
    Actuator = "act",
    Data = "dmap",
    Process = "proc",
    UriVariable = "uv",
    Input = "i",
    Output = "o",
    EventData = "d",
    Subscription = "s",
    Cancellation = "c"
}

/**
 * Base class for the instances of 'VTMNode' that represent objects in
 * a Virtual Thing Description and that are addressable by 'Pointer' instances.
 */
export abstract class Component extends VTMNode { }

/**
 * Base class for the instances of 'Component' that may have other instances
 * of 'Component' as children.
 */
export abstract class ComponentOwner extends Component {
    
    /**
     * Returns the child component of the required type
     * if such a child exists, throws an error otherwise.
     * 
     * @param type
     */
    abstract getChildComponent(type: ComponentType): Component;

    protected errChildDoesNotExist(type: string){
        u.fatal(`Child component does not exist: "${type}"`, this.getFullPath());
    }
}

/**
 * Base class for the instances of 'ComponentOwner' that may have simulation-related
 * behavior specified, i.e. have properties 'dataMap' and/or 'processes'
 * in Virtual Thing Description.
 */
export abstract class Behavior extends ComponentOwner {

    //#region Child components
    protected dataMap: ComponentMap = undefined;
    protected processes: ComponentMap = undefined;
    //#endregion

    public constructor(name: string, parent: ComponentOwner, jsonObj: IBehavior){
        super(name, parent);

        if(jsonObj.dataMap){
            this.dataMap = ComponentFactory.createComponentMap(ComponentType.Data,
                "dataMap", this, jsonObj.dataMap);
        }            
        
        if(jsonObj.processes){
            this.processes = ComponentFactory.createComponentMap(ComponentType.Process,
                "processes", this, jsonObj.processes);
        }            
    }
}

/**
 * Base class for the instances of 'Component' that represent entries
 * in 'sensors' and 'actuators' properies of a Virtual Thing Description.
 */
export abstract class Hardware extends Behavior {    
}

/**
 * Class that represents maps of components in Virtual Thing Description,
 * e.g. 'properties', 'actions', 'dataMap', 'sensors', etc.
 */
export class ComponentMap extends ComponentOwner {

    // Entries of this map are the child nodes of this node
    private map: Map<string, Component> = new Map();

    public constructor(name: string, parent: VTMNode){
        super(name, parent);
    }

    /**
     * Adds a component to the map and sets self
     * as the parent of the given component if possible,
     * throws an error otherwise.
     * 
     * @param component The component to add.
     */
    public addComponent(component: Component){
        if(component instanceof Component){
            component.setParent(this);
            this.map.set(component.getName(), component);
        }else{
            u.fatal("A child component must be of type 'Component'.");
        }
    }
    
    /**
     * Returns the child component with the given name
     * if such a child exists, throws an error otherwise.
     * 
     * @param name Name of the component, e.g. given that the component map
     * represents 'actions' in a Virtual Thing Description,
     * this parameter represents the name of a particular
     * action object.
     */
    public getChildComponent(name: string): Component {
        let component = this.map.get(name);
        if(component === undefined){
            this.errChildDoesNotExist(name);
        }
        return component;
    }

    public getKeys(): string[] {
        return Array.from(this.map.keys());
    }
}