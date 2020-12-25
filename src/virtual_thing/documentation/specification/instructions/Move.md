# Move
Is a type of [Instruction] that is used to read values from one entities and write to others.

## Schema

Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|from||yes|[ValueSource]||
|to|||[ValueTarget]||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior

1. The value of `from` will be read.
2. If `to` is specified, the previously read value will be written to it.

A `Move` instruction without `to` can be used, e.g. to pop an item from an array without storing it somewhere.




[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[Instruction]: Instruction.md

[ValueSource]: ../helper_components/ValueSource.md
[ValueTarget]: ../helper_components/ValueTarget.md