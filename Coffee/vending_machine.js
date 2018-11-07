let vendingMachine = WoT.produce({
    name: "Virtual-Vending-Machine",
    description: "A virtual vending machine to learn the WoT TD standard",
    id: "de:tum:ei:esi:fp:vending",
    security: [{scheme: "nosec"}]
});

// #### Properties ####

vendingMachine.addProperty(
    "connected",
    {
        type: "boolean",
        writable: true
    },
    false
);

vendingMachine.addProperty(
    "state",
    {
        type: "string",
        writable: true,
        enum: ["Offline", "Ready", "Brewing", "Error"],
    },
    "Offline"
);

// #### Actions ####

vendingMachine.addAction(
    "info",
    {
        input: {
        type: "string",
        }
    },
    (infoMessage) => { console.log("### Vending Machine - Showing info message: " + infoMessage); }
);

vendingMachine.addAction(
    "error",
    {
        input: {
        type: "string",
        }
    },
    (errorMessage) => { console.log("### Vending Machine - Showing error: " + errorMessage); }
);

// #### Events ####

vendingMachine.addEvent(
    "shutdown",
    {
        type: "null"
    }
);

vendingMachine.addEvent(
    "order",
    {
      type: "string"
    }
);

vendingMachine.addEvent(
    "abort",
    {
      type: "string"
    }
);

// Generate an order event every 5 seconds.
setInterval( async () => {
    console.log("### Vending Machine: Ordering a coffee.");
    vendingMachine.events.order.emit("espresso");
    }, 5000
);

vendingMachine.expose();