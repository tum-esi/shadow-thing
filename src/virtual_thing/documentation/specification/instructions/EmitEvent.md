# EmitEvent
Is a type of [Instruction] that is used to emit [Events][Event].

## Schema

Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|pointer|A pointer to an existing [Event], e.g. "e/myEvent", "e/${path/to/event/name}", etc.|yes|[Pointer]||
|data|Payload, if applicable.||[ValueSource]||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior
Will emit the specified [Event] with the given payload. If there is no `data` property defined in the [Event], the payload will be ignored.

[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[Instruction]: Instruction.md
[Event]: ../main_components/Event.md

[Pointer]: ../helper_components/Pointer.md
[ValueSource]: ../helper_components/ValueSource.md
