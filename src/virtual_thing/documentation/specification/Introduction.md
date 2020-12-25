# Introduction

The Virtual Thing Description (VTD) is an extension to the [Thing Description][td] that is meant to provide a no-code method to describe behavior (back-end logic) of a [Thing] in order to simulate it. Such a description is composed of various json-based `components`, which describe respective [instructions] executed in a certain order, at certain times, based on some conditions, etc. Together, those components describe how a [Thing] should behave, i.e. how to handle interactions, simulate sensor values, actuator states, etc. To instantiate a simulated [Thing], the [Engine] parses its VTD, instantiates (exposes) a [Thing], and executes the [instructions](#instructions) (handles interactions, simulates values, etc.) according to the VTD.
 





[instructions]: Architecture.md#instructions
[Engine]: Definitions.md#Virtual-Thing-Engine-and-Engine
[td]: https://www.w3.org/TR/wot-thing-description
[Thing]: https://www.w3.org/TR/wot-thing-description/#thing