# Virtual Thing
Virtual Thing is a `simulation engine` for [Things][thing]. It can instantiate a simulated Thing based on its [Virtual Thing Description][vtd] - the [Thing Description][td] complemented by description of the respective device's "behavior", which is interpreted and executed by the simulation engine.

## Build
Is built as part of the `Shadow Thing`.

## Run
Is embedded into the `Shadow Thing`. Can, however, be used as a standalone application by means of the built-in [CLI][cli].

## Developer Notes
Please search for "TODO"s in sources.

[td]: https://www.w3.org/TR/wot-thing-description/
[vtd]: documentation/specification/index.md
[cli]: documentation/cli.md
[thing]: https://www.w3.org/TR/wot-thing-description/#thing