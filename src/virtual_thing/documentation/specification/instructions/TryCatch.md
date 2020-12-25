# TryCatch
Is a type of [Instruction] that is used to avoid [VirtualThingModel failure][failure] when performing unsafe operations, i.e. an analog of the `try-catch` block in programming languages.

## Schema

Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|try||yes|Array of [Instruction], at least 1 item||
|catch|||Array of [Instruction], at least 1 item||
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior

The `try` block will be executed. If an error or failure happens:
- the error message will be stored
- if the `catch` is specified, it will be executed.

### The Error message
In the scope of the `catch`, the error message can be accessed using a [Pointer] path "err".

## Examples
```JSON
{
    "try": [
        { some instruction that causes a failure }
    ],
    "catch": [
        { "log": "Error occurred: ${err}." }
    ]
}
```

[Engine]: ../Definitions.md#virtual-thing-engine-and-engine

[Instruction]: Instruction.md

[failure]: ../main_components/VirtualThingModel.md#Failure

[Pointer]: ../helper_components/Pointer.md
