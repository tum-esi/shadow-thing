import {
    VirtualThingModel,
    Component,
    ComponentOwner,
    ComponentType,
    ComponentMap,
    Property,
    Action,
    Event,
    Sensor,
    Actuator,
    Process,
    u,
    DataHolder,
    Data
} from "../index"


/** Provides static functions to create instances of classes derived from 'Component' */
export class ComponentFactory {

    /**
     * Creates and returns an instance of 'ComponentMap' with the components
     * of the given type from the given json object.
     * 
     * @param componentType Type of the components in the component map.
     * @param name Name of the component map (name of the node).
     * @param parent Parent of the component map (parent node).
     * @param jsonObj A valid object. The object should have only properties
     * of a type that is needed to create instances of the required
     * component type.
     * Examples: if the required component type is 'Processes', then the value of this
     * parameter can be a 'processes' object of a valid Virtual Thing Description.
     */
    public static createComponentMap(componentType: ComponentType,
                                    name: string,
                                    parent: ComponentOwner,
                                    jsonObj: object): ComponentMap {
        let componentMap = new ComponentMap(name, parent);        
        if(jsonObj){
            for (let key in jsonObj){
                componentMap.addComponent(this.createComponent(componentType, key, componentMap, jsonObj[key]));
            }            
        }    
        return componentMap;
    }

    /**
     * Creates and returns an instance of 'Component'
     * of the given type from the given json object.
     * 
     * @param componentType Type of the component.
     * @param name Name of the component (name of the node).
     * @param parent Parent of the component (parent node).
     * @param jsonObj A valid object. The object should be of a type that
     * is needed to create an instance of the required component type.
     * Examples: if the required component type is 'Processes', then the value of this
     * parameter can be an entry from a 'processes' object of a valid Virtual Thing Description.
     */
    public static createComponent(comonentType: ComponentType,
                                name: string,
                                parent: ComponentOwner,
                                jsonObj: any): Component {

        if(jsonObj == undefined){
            return undefined;
        }
        
        switch(comonentType){
            case ComponentType.Property:
                return new Property(name, parent, jsonObj);
            case ComponentType.Action:
                return new Action(name, parent, jsonObj);
            case ComponentType.Event:
                return new Event(name, parent, jsonObj);
            case ComponentType.Sensor:
                return new Sensor(name, parent, jsonObj);
            case ComponentType.Actuator:
                return new Actuator(name, parent, jsonObj);
            case ComponentType.Process:
                return new Process(name, parent, jsonObj);
            case ComponentType.Data:
            case ComponentType.EventData:
            case ComponentType.Output:
                return DataHolder.getInstance(name, parent, jsonObj);
            case ComponentType.UriVariable:
            case ComponentType.Input:
            case ComponentType.Subscription:
            case ComponentType.Cancellation:
                return new Data(name, parent, jsonObj);
            case ComponentType.Model:
                return new VirtualThingModel(name, jsonObj);
            default:
                u.fatal(`Can't make a component of type: ${comonentType}`, "Component factory");
        }

        return undefined;
    }
}
