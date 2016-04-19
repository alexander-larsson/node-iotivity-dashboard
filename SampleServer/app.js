var lightResource,
  haveObservers = false,
  device = require("iotivity-node")(),
  settings = {
    role: "server",
    info: {
      name: "anima-node-iotivity-demo-server",
      manufacturerName: "Anima",
      manufactureDate: "Wed March 23 13:19:17 CEST 2016",
      platformVersion: "1.0.1",
      firmwareVersion: "0.0.1",
      supportUrl: "http://animaconnected.com/"
    }
  };

console.log("Server started");

device.configure(settings).then(function() {

  function lightResourceOnRequest(request) {

    function handleError(theError) {
      console.error(theError);
      throw theError;
    }
    if (request.type === "observe") {
      request.sendResponse(null).then(function() {
        haveObservers = true;
      }, handleError);
    } else if (request.type === "retrieve") {
      request.sendResponse(lightResource).catch(handleError);
    } else if (request.type === "update") {
      request.sendResponse(null).catch(handleError);

      lightResource.properties.state = request.res.state;
      console.log(lightResource);

      if(lightResource.properties.state ){
        console.log("Light turned ON");
      }else{
        console.log("Light turned OFF");
      }

    } else {
      request.sendError(null).catch(handleError);
    }
  }

  if (device.settings.info.uuid) {
    device.enablePresence(60);
    device.registerResource({
      id: {
        path: "/light"
      },
      resourceTypes: ["core.light"],
      interfaces: ["oic.if.baseline"],
      discoverable: true,
      observable: true,
      properties: {
        name: "Cool light",
        power: 100,
        state: false
      }
    }).then(
      function(resource) {
        lightResource = resource;
        device.addEventListener("request", lightResourceOnRequest);
        console.log("Light resource registered sucessfully at /light")
      },
      function(error) {
        throw error;
      });
  }
}).catch(function(theError) {
  console.error(theError);
  throw theError;
});
