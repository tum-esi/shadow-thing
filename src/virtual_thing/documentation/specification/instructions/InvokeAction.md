# InvokeAction
Is a type of [Instruction] that is used to invoke [Actions][Action], `own` as well as of an `external ConsumedThing`.

## Schema

Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|webUri|Uri of a ConsumedThing. If omitted, the ExposedThing will be used, i.e. interact with own affordance.||[ParameterizedString]||
|name|Name of the interaction affordance.|yes|[ParameterizedString]||
|uriVariables|Uri variables of the request.||Map of [ValueSource]||
|input|An input to `send to` the [Action].||[ValueSource]||
|output|Where to store the output `returned from` the [Action].||[ValueTarget]||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior
1. If a `webUri` is specified, the respective Thing will be consumed,
else the own ExposedThing will be treated as a ConsumedThing.
2. Uri variables, if any, will be resolved:
    - for each entry in the map `uriVariables`, its value will be replaced by the value returned by the respective [ValueSource] instance.
    - The resulting map `uriVariables` will be used as uri variables.
3. The interaction will be invoked using the uri variables, and the result will be awaited.
4. If the `output` is specified, the returned value will be written to the output. Here, if the [Action] is not supposed to return anything, an undefined value will be written.


[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[Instruction]: Instruction.md
[Action]: ../main_components/Action.md

[ValueSource]: ../helper_components/ValueSource.md
[ValueTarget]: ../helper_components/ValueTarget.md
[ParameterizedString]: ../helper_components/ParameterizedString.md
