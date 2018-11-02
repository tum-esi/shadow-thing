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
    (input) => { console.log("Brewing: " + input); }
);

thing.addAction(
    "abort",
    {},
    () => {}
);

thing.addAction(
    "shutdown",
    {},
    () => {}
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

// Generate an event every 50 seconds.
setInterval( async () => {
    thing.events.maintenance.emit("Bin is full");
    }, 50000
);

thing.expose();