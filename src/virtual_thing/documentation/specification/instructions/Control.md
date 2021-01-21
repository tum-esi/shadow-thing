# Control

Is a type of [Instruction] that is used to perform some program flow control operations.

## Schema
Type: `string`  
Allowed values: `"break"`, `"continue"`, `"return"`, `"shutdown"`

## Behavior

### `"break"`
Can be used in the scope of a [Loop] to abort its execution unconditionally. If the Loop has other, nested Loops in its scope, the instruction will affect the first parent Loop.

### `"continue"`
Can be used in the scope of a [Loop] to abort execution of its current iteration and continue with the next, if applicable. If the Loop has other, nested Loops in its scope, the instruction will affect the first parent Loop.

### `"return"`
Aborts execution of the [Process] in whose scope the instruction is invoked.

### `"shutdown"`
[Stops][stop] operation of a [VirtualThingModel] instance.

[Instruction]: Instruction.md
[Loop]: Loop.md

[Process]: ../main_components/Process.md

[VirtualThingModel]: ../main_components/VirtualThingModel.md
[stop]: ../main_components/VirtualThingModel.md#Stop