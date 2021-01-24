# Action
Is [ActionAffordance] complemented by Virtual Thing-related functionality.

## Schema
Extends [ActionAffordance] with the following differences:
- the overriden properties are: `uriVariables`, `input` and `output`
- there are additional properties.

| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|uriVariables|See [InteractionAffordance].||Map of [DataHolder]||
|input|See [ActionAffordance].||[DataHolder]||
|output|See [ActionAffordance].||[DataHolder]||
| dataMap | See [DataMap]. | | Map of [DataHolder] | |
| processes | See [Processes]. | | Map of [Process] | |

## Behavior
- For the specified `input` and `output` properties of each `Action` instance, the [Engine] will create respectively an `input-buffer` and an `output-buffer` that can be accessed by any [Process] in the [Virtual Thing Description][vtd] any time.

- For each entry in `uriVariables`, the [Engine] will create a respective `uriVar-buffer` that can be accessed by any [Process] in the [Virtual Thing Description][vtd] any time.

### `invokeAction` handling
1. All `uriVar-buffers` are [reset].
2. The incoming uri variables are written into their respective `uriVar-buffers`. If any uri variable does not comply with the schema, an error occurs.
3. If an `input-buffer` exists:
    - The `input-buffer` is [reset].
    - The incoming payload (if any) is written into the `input-buffer`. If the payload does not comply with the schema, an error occurs.
4. The attached [triggers][Trigger] and the [implicitly attached processes](#implicitly-attached-processes) are invoked `sequentially` and `awaited`.
5. If an `output-buffer` exists, its content is returned as the response payload.

If at any step an error occurs, it is printed and the handler returns nothing.

### Implicitly attached processes
If a `Process` in the `processes` of an `Action` has **no explicitly defined** `triggers`, it will be invoked automatically on each `invokeAction` event.

[InteractionAffordance]: https://www.w3.org/TR/wot-thing-description/#interactionaffordance

[ActionAffordance]: https://www.w3.org/TR/wot-thing-description/#actionaffordance

[Trigger]: ../helper_components/Trigger.md

[reset]: DataHolder.md#reset-value-and-access-rights

[DataHolder]: DataHolder.md
[Process]: Process.md

[vtd]: ../Definitions.md#virtual-thing-description
[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[DataMap]: ../Architecture.md#DataMap
[Processes]: ../Architecture.md#Processes