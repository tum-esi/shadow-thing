# VirtualThingModel
The root object in the [Virtual Thing Description][vtd].

## Schema

Extends [Thing] with the following differences:
- the mandatory properties of [Thing] are not mandatory
- the overriden properties are: `properties`, `actions` and `events`
- there are additional properties.

| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
| properties | Property affordances. | | Map of [Property] | |
| actions | Action affordances. | | Map of [Action] | |
| events | Event affordances. | | Map of [Event] | |
| sensors | Sensor description entries. | | Map of [Sensor] | |
| actuators | Actuator description entries. | | Map of [Actuator] | |
| dataMap | See [DataMap]. | | Map of [DataHolder] | |
| processes | See [Processes]. | | Map of [Process] | |
| dataSchemas | Reusable schemas for [DataHolder] entries. | | Map of [DataHolder] | |


## Behavior

### Start
A `VirtualThingModel` starts when you run the program.  
On start, the model:
1. Invokes all the [Trigger] instances registered for the `"startup"` [RuntimeEvent] *in parallel*.
2. Runs all the [Interval] instances that preriodically invoke [Triggers][Trigger], i.e. runs their respective [Processes][Process].

### Stop
A `VirtualThingModel` instance can stop in the following cases:
- Initiated by the `"shutdown"` command of a [Control] instruction.
- On model [Failure](#failure).

On stop, the model:
1. *Sequentially* invokes and `awaits` each [Trigger] instance registered for the `"shutdown"` [RuntimeEvent].
2. Stops all the [Interval] instances that periodically invoke [Triggers][Trigger].
3. Aborts all the [Processes][Process] that still run.

> NOTE: After a `VirtualThingModel` instance is stopped, the [Engine] invokes `destroy()` of the respective `ExposedThing`. This is supposed to destroy the `ExposedThing`, however, at the time of writing of this document, `ExposedThing.destroy()` was not implemented in [node-wot]. Thus, after stop, the model may still process interaction events.

### Failure
 A `VirtualThingModel` instance should fail if a [fatal error][fatal] happens, unless it happens in the scope of a [TryCatch] instruction. Normal [errors][error] should not lead to a failure. A failure will issue a [Stop](#stop).



[node-wot]: https://github.com/eclipse/thingweb.node-wot

[vtd]: ../Definitions.md#virtual-thing-description
[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[fatal]: ../LogsAndErrors.md#Fatal-Errors
[error]: ../LogsAndErrors.md#Errors

[Property]: Property.md
[Action]: Action.md
[Event]: Event.md
[DataHolder]: DataHolder.md
[Process]: Process.md
[Sensor]: Sensor.md
[Actuator]: Actuator.md

[TryCatch]: ../instructions/TryCatch.md

[DataMap]: ../Architecture.md#DataMap
[Processes]: ../Architecture.md#Processes

[Thing]: https://www.w3.org/TR/wot-thing-description/#thing

[Control]: ../instructions/Control.md

[Interval]: ../helper_components/Interval.md
[Trigger]: ../helper_components/Trigger.md
[RuntimeEvent]: ../helper_components/Enums.md#RuntimeEvent