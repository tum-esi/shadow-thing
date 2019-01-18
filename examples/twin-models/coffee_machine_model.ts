import { DigitalTwin, DTCustomResponse, DTCustomHandler } from "../../src/digital-twin";

// Class MUST be named "DigitalTwinModel" to be recognized by the CLI
export class DigitalTwinModel {

    constructor(digitalTwin: DigitalTwin) {
        digitalTwin.addCustomPropertyReadHandler("waterStatus", this.customWaterStatReadHandler);
        digitalTwin.addCustomPropertyReadHandler("state", this.customStateHandler);
    }

    // Any custom handler function MUST always be of type DTCustomHandler. (either explicitly or implicitly)
    private customWaterStatReadHandler: DTCustomHandler = (lastValue: any, timestamp: Date) => {
        return new Promise<DTCustomResponse>((resolve, reject) => { 
            if (lastValue === null || timestamp === null) { resolve({data: 0, accuracy: 0}); }
            
            let newValue = {
                data: 0,
                accuracy: 0
            }
            // for example: every 2 sec between actualtime/timestamp : reduce status by 1%, accuracy by 5pts
            let dateDelta = Date.now() - timestamp.valueOf();
            let valueDelta = Math.floor(dateDelta / 2000);
            let accuracy = 100 - Math.floor((dateDelta / 1000));

            (lastValue - valueDelta) < 0 ? newValue.data = 0 : newValue.data = lastValue - valueDelta;
            accuracy < 0 ? newValue.accuracy = 0 : newValue.accuracy = accuracy;

            resolve(newValue); 
        })
    }

    // An example of an extremely minimal model.
    private customStateHandler(astValue: any, timestamp: Date) {
        return new Promise<DTCustomResponse>((resolve, reject) => {
            resolve({
                data: "Ready",
                accuracy: 0
            })
        })
    }
}