# SubscribeEvent
Is a type of [Instruction] that is used to observe [Events][Event], `own` as well as of an `external ConsumedThing`.

## Schema

Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|webUri|Uri of a ConsumedThing. If omitted, the ExposedThing will be used, i.e. interact with own affordance.||[ParameterizedString]||
|name|Name of the interaction affordance.|yes|[ParameterizedString]||
|uriVariables|Uri variables of the request.||Map of [ValueSource]||
|data|Where to store the received payload when the [Event] is emitted.||[ValueTarget]||
|onEmit|A handler to be invoked when the [Event] is emitted. ||Array of [Instruction], at least 1 item||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior
1. If a `webUri` is specified, the respective Thing will be consumed,
else the own ExposedThing will be treated as a ConsumedThing.
2. Uri variables, if any, will be resolved:
    - for each entry in the map `uriVariables`, its value will be replaced by the value returned by the respective [ValueSource] instance.
    - The resulting map `uriVariables` will be used as uri variables.
3. The interaction will be invoked using the uri variables, and the result will be awaited.

**Each time an event is emmited**:
1. If the `data` is specified, the received payload will be written to it.
2. If the `onEmit` is specified, its instructions will be executed.


[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[Instruction]: Instruction.md
[Event]: ../main_components/Event.md

[ValueSource]: ../helper_components/ValueSource.md
[ValueTarget]: ../helper_components/ValueTarget.md
[ParameterizedString]: ../helper_components/ParameterizedString.md
