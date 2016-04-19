# Node IoTivity Dashboard

## Repository Contents

This repo contains two separate node project. These are:

1. SampleServer: A sample IoTivity server that represents a light and prints state changes to console.
2. IoTivityClient: An IoTivity client that presents all discovered resources on a website and enables a user to control them.

## Setup

1. Make sure you have node.js installed (tested with version 4.4 LTS)
2. Check out this repo
3. Navigate to each of of the projects and run `npm install` to install all dependencies
4. Run the server/client with `node app.js`

When running `npm install` IoTivity 1.0.1 is downloaded and built. Additional tools and frameworks are required to build IoTivity. On linux these can be installed with:
```
sudo apt-get install libboost-dev libboost-program-options-dev libexpat1-dev libboost-thread-dev uuid-dev libssl-dev scons libglib2.0-dev build-essentials g++
```

These tools can easily be installed on Mac using Homebrew:
```
brew install boost
brew install scons
brew install ossp-uuid
brew install glib
```

Also make sure you have the standard build tools installed on your Mac:
```
xcode-select --install
```

The build process will most likely fail on Mac with an error saying that `stdassert.h` cannot be found. A simple fix for this is to add a header file named `stdassert.h` in `/usr/local/include`. This file should just contain the the single line below:

```c
#include <assert.h>
```
