import {
    ComponentOwner,
    Hardware,
    ISensor,
    Component,
    ComponentType
} from "../index";


/** Class that represents a Sensor in Virtual Thing Description. */
export class Sensor extends Hardware {

    public constructor(name: string, parent: ComponentOwner, jsonObj: ISensor){
        super(name, parent, jsonObj);
    }

    public getChildComponent(type: ComponentType): Component {

        let component = undefined;
        
        switch(type){
            case ComponentType.Process:
                component = this.processes;
                break;
            case ComponentType.Data:
                component = this.dataMap;
                break;
        }
        if(component == undefined){
            this.errChildDoesNotExist(type);
        }
        return component;
    }
}