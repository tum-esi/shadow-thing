# Property
Is [PropertyAffordance] complemented by Virtual Thing-related functionality.

## Schema
Extends [InteractionAffordance] and [DataHolder] with the following differences:
- the overriden property is: `uriVariables`
- there are additional properties.

| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|uriVariables|See [InteractionAffordance].||Map of [DataHolder].||
| dataMap | See [DataMap]. | | Map of [DataHolder] | |
| processes | See [Processes]. | | Map of [Process] | |

## Behavior
- For each `Property` instance, the [Engine] will create a `property-buffer` - an instance of [DataHolder] that can be accessed by any [Process] in the [Virtual Thing Description][vtd] any time.

- For each entry in `uriVariables`, the [Engine] will create a respective `uriVar-buffer` that can be accessed by any [Process] in the [Virtual Thing Description][vtd] any time.

### `readProperty` handling
1. All `uriVar-buffers` are [reset].
2. The incoming uri variables are written into their respective `uriVar-buffers`. If any uri variable does not comply with the schema, an error occurs.
3. The attached [triggers][Trigger] and processes are invoked `sequentially` and `awaited`.
4. The content of the `property-buffer` is returned as the response payload.

If at any step an error occurs, it is printed and the handler returns nothing.

### `writeProperty` handling
1. All `uriVar-buffers` are [reset].
2. The incoming uri variables are written into their respective `uriVar-buffers`. If any uri variable does not comply with the schema, an error occurs.
3. The `property-buffer` is [reset].
4. The incoming payload (if any) is written into the `property-buffer`. If the payload does not comply with the schema, or the `property-buffer` is [read only][RO], an error occurs.
5. The attached [triggers][Trigger] and the [implicitly attached processes](#implicitly-attached-processes) are invoked `sequentially` and `awaited`.

If at any step an error occurs, it is printed and the handler returns.

### Implicitly attached processes
If a `Process` in the `processes` of a `Property` has **no explicitly defined** `triggers`, it will be attached to certain interaction events depending on the name of the process:  

|Process name|Interaction event that will invoke the process|
|------------|:---------------:|
|"read"|`readProperty`|
|"write"|`writeProperty`|
|any other name|`readProperty` and `writeProperty`|


[InteractionAffordance]: https://www.w3.org/TR/wot-thing-description/#interactionaffordance

[PropertyAffordance]: https://www.w3.org/TR/wot-thing-description/#propertyaffordance

[Trigger]: ../helper_components/Trigger.md

[RO]: DataHolder.md#reset-value-and-access-rights
[reset]: DataHolder.md#reset-value-and-access-rights

[DataHolder]: DataHolder.md
[Process]: Process.md

[vtd]: ../Definitions.md#virtual-thing-description
[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[DataMap]: ../Architecture.md#DataMap
[Processes]: ../Architecture.md#Processes