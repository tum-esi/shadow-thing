# Virtual Thing

Creates and deploys a virtual thing based on its TD

## Why use this software
You may want to create a mashup scenario or a test script for a WoT thing that you only have a TD for. This tool allows you to simulate a thing based only on its TD.

## Prerequisites
All systems require:
* [NodeJS](https://nodejs.org/) version 10+ (e.g., 10.13.0 LTS)

### Linux
Meet the [node-gyp](https://github.com/nodejs/node-gyp#installation) requirements:
* Python 2.7 (v3.x.x is not supported)
* make
* A proper C/C++ compiler toolchain, like GCC

### Windows
Install the Windows build tools through a CMD shell as administrator:
```
npm install -g --production windows-build-tools
```

### Mac OS
Meet the [node-gyp](https://github.com/nodejs/node-gyp#installation) requirements:
```
xcode-select --install
```

## How to start a virtual thing
Clone this repository and go into it:
```
git clone https://github.com/tum-ei-esi/virtual-thing
cd virtual-thing
```
Install dependencies and build project:
```
npm install 
npm run build
```

### Optional
Make the package available on your local machine (as a symlink). You can then use each paket in its local version via `npm link <module>` instead of `npm install <module>` (see also https://docs.npmjs.com/cli/link).
```
npm link
```


## Useful Links:
1. [Thing Description Specification](https://w3c.github.io/wot-thing-description/#thing)
3. [Scripting API Specification](https://w3c.github.io/wot-scripting-api/)
4. [node-wot implementation of the Scripting API](https://github.com/eclipse/thingweb.node-wot)