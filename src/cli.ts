import { VirtualThing } from "./virtual-thing"


// An example of a TD. 
// TODO: read from a file given as cli argument.
let td = `{
    "@context": "http://www.w3.org/ns/td",
    "@type": "Thing",
    "id": "de:tum:ei:esi:fp:coffee",
    "name": "Virtual-Coffee-Machine",
    "description": "A virtual coffee machine to learn the WoT TD standard",
    "base": "http://localhost:8080/virtual-coffee-machine/",
    "security": [{"scheme": "nosec"}],
    "properties": {
        "state": {
            "type": "string",
            "readOnly": true,
            "enum": ["Ready", "Brewing", "Error"],
            "forms": [{"href": "properties/state"}]
        },
        "waterStatus": {
            "type": "integer",
            "readOnly": true,
            "unit": "%",
            "forms": [{"href": "properties/water"}]
        },
        "coffeeStatus": {
            "type": "integer",
            "readOnly": true,
            "unit": "%",
            "forms": [{"href": "properties/coffee"}]
        },
        "binStatus": {
            "type": "integer",
            "readOnly": true,
            "unit": "%",
            "forms": [{"href": "properties/bin"}]
        }
    },
    "actions": {
        "brew": {
            "input": {
                "type": "string",
                "enum": ["latte-machiato", "espresso", "cappuccino"]
            },
            "forms": [{"href": "actions/brew"}]
        },
        "abort": {
            "forms": [{"href": "actions/abort"}]
        },
        "shutdown": {
            "forms": [{"href": "actions/shutdown"}]
        }
    },
    "events":{
        "maintenance": {
            "data": {"type": "string"},
            "forms": [{
                "href": "events/maintenance",
                "subprotocol": "longpoll"
            }]
        },
        "error": {
            "data": {"type": "string"},
            "forms": [{
                "href": "events/error",
                "subprotocol": "longpoll"
            }]
        }
    }
}`

let virtualThing = new VirtualThing(td);