# File
File is used by [ValueSource] and [ValueTarget] for respectively file read and write operations.

## Schema
Type: [ParameterizedString] - path to a file. Must be either absolute or relative to the `working directory` where the [Engine] is running.

## Behavior

- On write: if the file does not exist, it will be created.
- On read: if the file does not exists, a [fatal error][fatal] will occur.


[fatal]: ../LogsAndErrors.md#Fatal-Errors
[ParameterizedString]: ParameterizedString.md
[Engine]: ../Definitions.md#Virtual-Thing-Engine-and-Engine
[ValueSource]: ValueSource.md
[ValueTarget]: ValueTarget.md


