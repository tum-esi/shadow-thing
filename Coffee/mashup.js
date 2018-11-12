let coffeeMachine;
let vendingMachine;

// Connect to the coffee machine and create a corresponding object
let coffeePromise = WoT.fetch("http://localhost:8080/Virtual-Coffee-Machine");
coffeePromise.then(
    (thingDescription) => { 
        let fetchedObject = WoT.consume(thingDescription);
        fetchedObject.id === "de:tum:ei:esi:fp:coffee" ? coffeeMachine = fetchedObject : console.log("ERROR: The fetched object is not a coffee machine.") 
    },
    (error) => { console.log("ERROR: ", error); }
);

// Connect to the vending machine and create a corresponding object
let vendingPromise = WoT.fetch("http://localhost:8080/Virtual-Vending-Machine");
vendingPromise.then(
    (thingDescription) => { 
        let fetchedObject = WoT.consume(thingDescription);
        fetchedObject.id === "de:tum:ei:esi:fp:vending" ? vendingMachine = fetchedObject : console.log("ERROR: The fetched object is not a vending machine.") 
    },
    (error) => { console.log("MASHUP ERROR: ", error); },
);

// Wait for both connections to be established and then start vending.
Promise.all([vendingPromise, coffeePromise]).then(start_vending);

function start_vending() {
    // Set the vending machine connection flag to true
    vendingMachine.properties["connected"].write(true);

    // Fetch coffe machine state and update the vending machine accordingly
    coffeeMachine.properties["state"].read().then(
        (state) => {
            vendingMachine.properties["state"].write(state);
        }
    ).catch(
        (err) => console.log(err)
    );

    // Subscribe to and handle the coffee machine's error and maintenance events
    coffeeMachine.events["maintenance"].subscribe(
        (data) => { vendingMachine.actions["info"].invoke(data); },
        (err) => { console.log("MASHUP ERROR: " + err); }
    );
    coffeeMachine.events["error"].subscribe(
        (data) => { 
            vendingMachine.actions["error"].invoke(data);
            vendingMachine.properties["state"].write("Error");
        },
        (err) => { console.log("MASHUP ERROR: " + err); }
    );

    // Subscribe to and handle the vending machine's shutdown, brew and abort events
    vendingMachine.events["shutdown"].subscribe(
        (data) => { coffeeMachine.actions["shutdown"].invoke(); },
        (err) => { console.log("MASHUP ERROR: " + err); }
    );
    vendingMachine.events["order"].subscribe(
        (data) => { brew(data); },
        (err) => { console.log("MASHUP ERROR 122: " + err); }
    );
    vendingMachine.events["abort"].subscribe(
        (data) => { coffeeMachine.actions["abort"].invoke();  },
        (err) => { console.log("MASHUP ERROR: " + err); }
    );
}

function brew(coffeeType) {
    coffeeMachine.actions["brew"].invoke(coffeeType).then( 
        () => {
            // check levels after brewing and issue warning if necessary
            let stats = ["waterStatus", "coffeeStatus"];
            for (stat of stats) {
                coffeeMachine.properties[stat].read().then(
                    (level) => {
                        if (level < 20) { 
                            vendingMachine.actions["info"].invoke(stat + " is less than 20% full."); 
                        }
                    }  
                ).catch(
                    (err) => console.log(err)
                );
            };
            coffeeMachine.properties["binStatus"].read().then(
                (level) => {
                    if (level > 80) { 
                        vendingMachine.actions["info"].invoke("Bin is more than 80% full.");
                    }
                } 
            ).catch(
                (err) => console.log(err)
            );
        }
    ).catch(
        (err) => { console.log(err); }
    );
}