# InvokeProcess
Is a type of [Instruction] that is used to invoke a [Process].

## Schema
One of:
- Type: [Pointer] - a pointer to the [Process] that should be invoked.

- Type: `object`
    | Property | Description | Mandatory | Type | Default |
    |----------|-------------|:---------:|------|:-------:|
    |pointer|A pointer to the [Process] that should be invoked.|yes|[Pointer]||
    |smOperation|State machine operation (see [Process]).||[StateMachineOperation]|"transit"|
    |comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

    **\*** additional properties are not allowed.


[Process]: ../main_components/Process.md
[Pointer]: ../helper_components/Pointer.md
[StateMachineOperation]: ../helper_components/Enums.md#StateMachineOperation
[Engine]: ../Definitions.md#virtual-thing-engine-and-engine