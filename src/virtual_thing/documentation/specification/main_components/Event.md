# Event
Is [EventAffordance] complemented by Virtual Thing-related functionality.

## Schema
Extends [EventAffordance] with the following differences:
- the overriden properties are: `uriVariables`, `data`, `subscription` and `cancellation`
- there are additional properties.

| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|uriVariables|See [InteractionAffordance].||Map of [DataHolder].||
|data|See [EventAffordance].||[DataHolder]||
|subscription|See [EventAffordance].||[DataHolder]||
|cancellation|See [EventAffordance].||[DataHolder]||
| dataMap | See [DataMap]. | | Map of [DataHolder] | |
| processes | See [Processes]. | | Map of [Process] | |

## Behavior
- For the specified `data`, `subscription` and `cancellation` properties of each `Event` instance, the [Engine] will create respectively a `data-buffer`, a `subscription-buffer` and a `cancellation-buffer` that can be accessed by any [Process] in the [Virtual Thing Description][vtd] any time.

- For each entry in `uriVariables`, the [Engine] will create a respective `uriVar-buffer` that can be accessed by any [Process] in the [Virtual Thing Description][vtd] any time.

### `Emit event` handling
After an event is emitted by the instruction [emitEvent], the attached [triggers][Trigger] and processes are invoked `sequentially` and `awaited`.

### `subscribeEvent` handling
1. All `uriVar-buffers` are [reset].
2. The incoming uri variables are written into their respective `uriVar-buffers`. If any uri variable does not comply with the schema, an error occurs.
3. If a `subscription-buffer` exists:
    - The `subscription-buffer` is [reset].
    - The incoming payload (if any) is written into the `subscription-buffer`. If the payload does not comply with the schema, an error occurs.
4. The attached [triggers][Trigger] and the `implicitly attached processes` are invoked `sequentially` and `awaited`.

If at any step an error occurs, it is printed and the handler returns.

### `unsubscribeEvent` handling
1. All `uriVar-buffers` are [reset].
2. The incoming uri variables are written into their respective `uriVar-buffers`. If any uri variable does not comply with the schema, an error occurs.
3. If a `cancellation-buffer` exists:
    - The `cancellation-buffer` is [reset].
    - The incoming payload (if any) is written into the `cancellation-buffer`. If the payload does not comply with the schema, an error occurs.
4. The attached [triggers][Trigger] and the [implicitly attached processes](#implicitly-attached-processes) are invoked `sequentially` and `awaited`.
    
If at any step an error occurs, it is printed and the handler returns.

> NOTE: the `subscribeEvent` and `unsubscribeEvent` at the time of writing of this document are not yet implemented in [node-wot]. The handlers described above are implemented only in Virtual Thing, and need to be attached to their respective handlers in [node-wot] when they are implemented.

### Implicitly attached processes  
If a `Process` in the `processes` of an `Event` has **no explicitly defined** `triggers`, it will be invoked automatically on certain interaction events depending on the name of the process:  

|Process name|Interaction event that will invoke the process|
|------------|:---------------:|
|"subscribe"|`subscribeEvent`|
|"unsubscribe"|`unsubscribeEvent`|
|any other name|`emitEvent`|


[InteractionAffordance]: https://www.w3.org/TR/wot-thing-description/#interactionaffordance

[EventAffordance]: https://www.w3.org/TR/wot-thing-description/#eventaffordance

[Trigger]: ../helper_components/Trigger.md

[reset]: DataHolder.md#reset-value-and-access-rights

[DataHolder]: DataHolder.md
[Process]: Process.md

[vtd]: ../Definitions.md#virtual-thing-description
[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[DataMap]: ../Architecture.md#DataMap
[Processes]: ../Architecture.md#Processes

[emitEvent]: ../instructions/EmitEvent.md

[node-wot]: https://github.com/eclipse/thingweb.node-wot