// function MUST be named "addTwinModel" and exported this way to be recognized by the CLI
exports.addTwinModel = function addTwinModel (digitalTwin) {
    digitalTwin.addCustomPropertyReadHandler("waterStatus", customWaterStatReadHandler);
    digitalTwin.addCustomPropertyReadHandler("state", customStateHandler);
}

// Any custom handler function MUST always take two parameters and return a promise
function customWaterStatReadHandler (lastValue, timestamp) {
    return new Promise((resolve, reject) => { 
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
function customStateHandler(lastValue, timestamp) {
    return new Promise((resolve, reject) => {
        resolve({
            data: "Ready",
            accuracy: 0
        })
    })
}