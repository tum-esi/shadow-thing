let thing = WoT.produce({
        name: "Virtual-Coffee-Machine",
        description: "A virtual coffee machine to learn the WoT TD standard",
        id: "de:tum:ei:esi:fp:coffee",
        security: [{scheme: "nosec"}]
    }
);

// Add and handle the state property
thing.addProperty(
    "state",
    {
        type: "string",
        enum: ["Ready", "Brewing", "Error"],
        writable: false
    }
);
thing.setPropertyReadHandler(
    "state",
    () => {
        return new Promise((resolve, reject) => {
            resolve("Ready");
        })
    }
);

// Add and handle water, coffee and bin fullness level stats (as %)
let stats = ["waterStatus", "coffeeStatus", "binStatus"];
for (item of stats) {
    thing.addProperty(
        item,
        {
            type: "integer",
            unit: "%",
            writable: false
        }
    );
    thing.setPropertyReadHandler(
        item,
        () => {
            return new Promise((resolve, reject) => {
                resolve(Math.floor(Math.random() * 100));
            })
        }
    );
}

thing.addAction(
    "brew",
    {
        input: {
        type: "string",
        enum: ["latte-machiato", "espresso", "cappuccino"]
        }
    },
    (request) => { console.log("### Coffee Machine: Brewing " + request); }
);

thing.addAction(
    "abort",
    {},
    () => { console.log("### Coffee Machine: Aborting..."); }
);

thing.addAction(
    "shutdown",
    {},
    () => { console.log("### Coffee Machine: Shutting down...");}
);

thing.addEvent(
    "maintenance",
    {
      type: "string"
    }
);

thing.addEvent(
    "error",
    {
      type: "string"
    }
);

// Generate a maintenance event every 10 seconds.
setInterval( async () => {
    console.log("### Coffee Machine: Emitting maintenance event.");
    thing.events.maintenance.emit("Bin is almost full.");
    }, 10000
);

thing.expose();