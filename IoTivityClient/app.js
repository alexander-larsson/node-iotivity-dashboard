var http = require('http');
var express = require('express');
var device = require("iotivity-node")();
var iot_resources = {}; // key-value store of JSON object representing OCF resources
var observed_resources = []; // list of the device ID strings for all observed resources

/*########### Set up of Express, HTTP and Socket.io #############*/

process.on('uncaughtException', function(err) {
  console.log(err);
});

function exitHandler() {
  // Unregister all observed resources before exit
  var unregisterResource = function(resourceString){
      var resource = iot_resources[resourceString];
      console.log("Unregister observe: " + resourceString);
      resource.removeEventListener("update", resourceUpdate);
  }
  observed_resources.map(unregisterResource);

  // Has to wait for resources to unregister first
  // Would prefer to do this in a callback but none avilable in
  // IoTivity node.js API
  setTimeout(function() {
      process.exit();
  }, 500);
}

//catches ctrl+c event
process.on('SIGINT', exitHandler);

var app = express();

app.use(express.static("public"));

var port = 10001;
server = app.listen(port, function() {
  console.log('listening on port ' + port);
  //var err = new Error('This error won't break the application...')
  //throw err
});

var io = require('socket.io')(server);

/*################## Socket.io Communications ###################*/

io.on('connection', function(socket) {
  socket.emit('resourcelist', objectToList(iot_resources));
  console.log("New connection");
  console.log(JSON.stringify(iot_resources,null,4));

  socket.on('refresh', function(data) {
    console.log("Refresh buttom pressed!");
    iot_resources = {};
    device.findResources();
    // Wait one second and return results
    setTimeout(function() {
      console.log(JSON.stringify(iot_resources,null,4));
      io.emit('resourcelist', objectToList(iot_resources));
    }, 1000);

  });

  socket.on('resource:update', function(resource) {
    device.updateResource(resource).
    then(function() {
      // Update server representation on success
      addIoTivityResource(resource);
      // Broadcast updated state too all clients except original updater
      socket.broadcast.emit('resourcelist', objectToList(iot_resources));
      console.log("Updated resource " + resource.id.path);
    }).
    catch(function() {
      console.log("Error, bad things happened");
    })

  });

    // Toggles observed on/off on each event for the specified resource
    socket.on('resource:observe', function(resource) {
      var resourceString = resourceIdString(resource.id);
      var resourceToObserve = iot_resources[resourceString];

      // Det är något fel med removeEventListener("update", resourceUpdate);
      // SKickar inte in en funktion

      if (observed_resources.indexOf(resourceString) >= 0) { // Stop observing the resource
        console.log("Stop observing " + resourceString);
        // Remove from observe list
        var index = observed_resources.indexOf(resourceString);
        // Onödig check kanske???
        if (index > -1) {
          observed_resources.splice(index, 1);
        }
        // Set observed proprty to false
        iot_resources[resourceString].observed = false;

        // Removing the listener tells IoTivty to stop observing
        resourceToObserve.removeEventListener("update", resourceUpdate);
        // Broadcast new state to all clients
        io.emit('resourcelist', objectToList(iot_resources));

      } else { // Start observing the resource

        console.log("Start observing " + resourceString);
        observed_resources.push(resourceString);
        iot_resources[resourceString].observed = true;

        // Start observing the resource.
        resourceToObserve.addEventListener("update", resourceUpdate);

        // Send updated state of resourceList
        io.emit('resourcelist', objectToList(iot_resources));

      }

    });

});


/*################## IoTivity Communications ####################*/

device.configure({
  role: "client"
}).then(function() {

  // Add a listener that will receive the results of the discovery
  device.addEventListener("resourcefound", function(event) {
    // Retrieve the full resource (with properties)
    console.log("Resource found");
    if (event.resource.id.path.substring(0, 5) !== "/oic/") {
      device.retrieveResource(event.resource.id).then(function(resource) {
        // Save the found resource
        console.log("Interesting resource found!");
        console.log(JSON.stringify(resource,null,4));
        addIoTivityResource(resource);
      });
    }

  });

  device.findResources();

});


/*##################### Helper functions ########################*/

// Creates an unique ID string based on the resource path and the UUID of the device
var resourceIdString = function(id) {
  return id.path + "@" + id.deviceId;
}

// Converts an object to a list containing all values in the object
var objectToList = function(obj) {
  var res = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      res.push(obj[key]);
    }
  }
  return res;
}

// Adds the observed property to a resource object with the correct value
// based on the list of strings
var addObserveProperty = function(observeList, resource) {
  var resourceString = resourceIdString(resource.id);

  if (observeList.indexOf(resourceString) >= 0) {
    resource.observed = true;
  } else {
    resource.observed = false;
  }
  return resource;
}

// Callback function for updates from observed resources
var resourceUpdate = function(event) {
  console.log("Received resource update event:\n" +
    JSON.stringify(event, null, 4));

  var resourceString = resourceIdString(event.resource.id);
  iot_resources[resourceString].properties = event.resource.properties;

  io.emit('resourcelist', objectToList(iot_resources));
};

// Adds a resource to the list of resources and marks it as observed if in the
// observe list
var addIoTivityResource = function(resource) {
  resource = addObserveProperty(observed_resources, resource);
  iot_resources[resourceIdString(resource.id)] = resource;
};
