# Trigger
Triggers are used in a [Process], they define when the Process should be invoked.

## Schema
Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|runtimeEvent|A runtime event that should invoke the `Trigger`. ||[RuntimeEvent]||
|interactionAffordance|Is used when the `runtimeEvent` corresponds to an interaction event. Is the name of the interaction affordance of the respective type, e.g. "myProperty". ||`string`||
|interval|The invokation interval in milliseconds. Is used when the `Trigger` should be invoked periodically. ||[Interval]||
|condition|If specified, the `Trigger` can be invoked only if the condition is met, i.e. the value of the expression can be interpreted as `true`.||[Math]||
|wait|Whether execution of the `Process` should be "awaited" by the `Trigger`.||`boolean`|true|
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior

- When a `Trigger` is `invoked`, it will in turn invoke the [Process] to which it belongs.
- A `Trigger` can have either a `runtimeEvent` specified or an 
`interval`.

### [RuntimeEvent]-based Triggers
- `"startup"` - invoked as described in [VirtualThingModel start][vtmstart].
- `"shutdown"` - invoked as described in [VirtualThingModel stop][vtmstop].
- `"readProperty"` - invoked as described in [readProperty handling][propread].
- `"writeProperty"` - invoked as described in [writeProperty handling][propwrite].
- `"invokeAction"` - invoked as described in [invokeAction handling][actioninvoke].
- `"emitEvent"` - invoked as described in [Emit event handling][emitevent].
- `"subscribeEvent"` - invoked as described in [unsubscribeEvent handling][subsevent].
- `"unsubscribeEvent"` - invoked as described in [unsubscribeEvent handling][unsubsevent].

### [Interval]-based Triggers
An Interval-based Trigger is invoked as described in [Interval behavior][intbeh]. Additional relevant information is provided in [VirtualThingModel start][vtmstart] and [VirtualThingModel stop][vtmstop].

## Examples
> NOTE: The examples are complete ready-to-run [Virtual Thing Descriptions][vtd].

- The process will be invoked (triggered) once per second. It will log current time.:

    ```JSON
    {
        "title": "Ticker",
        "processes": {
            "proc":{
                "triggers": [{"interval": "1000"}],
                "instructions": [
                    {"log": "Tick: ${dt/local}"}
                ]
            }
        }
    }
    ```
- The process will be invoked when the [Property] "myProp" is read or written:

    ```JSON
    {
        "title": "PropHandler",
        "properties": {
            "myProp": { }
        },
        "processes": {
            "proc":{
                "triggers": [
                    {
                        "runtimeEvent": "readProperty",
                        "interactionAffordance": "myProp"
                    },
                    {
                        "runtimeEvent": "writeProperty",
                        "interactionAffordance": "myProp"
                    }
                ],
                "instructions": [
                    {"log": "MyProp is either read or written."}
                ]
            }
        }
    }
    ```
> There is a shorter way to attach a [Process] to an interaction event without using Triggers. See `Implicitly attached processes` of [Property], [Action] and [Event].


[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[Math]: Math.md

[vtmstart]: ../main_components/VirtualThingModel.md#Start
[vtmstop]: ../main_components/VirtualThingModel.md#Stop
[actioninvoke]: ../main_components/Action.md#`invokeAction`-handling
[propread]: ../main_components/Property.md#`readProperty`-handling
[propwrite]: ../main_components/Property.md#`writeProperty`-handling
[emitevent]: ../main_components/Event.md#`Emit-event`-handling
[subsevent]: ../main_components/Event.md#`subscribeEvent`-handling
[unsubsevent]: ../main_components/Event.md#`unsubscribeEvent`-handling

[Action]: ../main_components/Action.md
[Event]: ../main_components/Event.md
[Process]: ../main_components/Process.md
[Property]: ../main_components/Property.md
[RuntimeEvent]: Enums.md#RuntimeEvent
[Math]: Math.md
[Interval]: Interval.md
[intbeh]: Interval.md#Behavior

[vtd]: ../Definitions.md#Virtual-Thing-Description