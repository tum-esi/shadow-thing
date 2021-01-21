# ValueTarget
Is used to `write` a value where needed.

## Schema

Type: `object`
| Property | Description | Mandatory | Type | Default |
|----------|-------------|:---------:|------|:-------:|
|pointer|A pointer to a valid entry in a [DataHolder] instance. An entry is valid when it exists, and the value that is being written complies with the entry's schema. ||[Pointer]||
|file|Append or overwrite a file with the value.||[File]||
|operation|See [Write operations](#write-operations).||[WriteOperation]|`"set"`|
|comment|A property to use on your own purpose, ignored by the [Engine].||`string` or Array of `string`||

**\*** additional properties are not allowed.

## Behavior
- A `ValueTarget` instance can be either of type `pointer` or `file` depending on which property is specified.

- Behavior of each `operation` depends on the type of the `ValueSource` and is described in [Write operations](#Write-operations).

### Write operations
- For a `pointer` ([Pointer]):
    - `"set"` - Write the value by reference.
    - `"push"` - Push the value by reference. The target must be an array.
    - `"copy"` - Write a deep copy of the value.
    - `"pushCopy"` - Push a deep copy of the value. The target must be an array.
    - `"concat"` - Append the value to a string. The target must be a string. The value should be a string (it will not be additionally stringified).

- For a `file` ([File]):
    - `"set"` and`"copy"` - overwrite the file with the value using utf-8 encoding.
    - `"concat"`, `"push"` and `"pushCopy"` - append the value to the file using utf-8 encoding.




[WriteOperation]: Enums.md#WriteOperation

[Pointer]: Pointer.md
[File]: File.md

[DataHolder]: ../main_components/DataHolder.md

[Engine]: ../Definitions.md#Virtual-Thing-Engine-and-Engine
