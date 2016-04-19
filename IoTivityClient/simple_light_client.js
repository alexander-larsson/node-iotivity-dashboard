var light = null,
  device = require("iotivity-node")();

console.log("Client started");

device.configure({
  role: "client"
}).then(function() {

  // Add a listener that will receive the results of the discovery
  device.addEventListener("resourcefound", function(event) {
    // We've discovered the resource we were seeking.
    if (event.resource.id.path === "/a/light") {

      console.log("Light resource found");

      //Requst the full resource object (with properties)
      device.retrieveResource(event.resource.id).then(function(resource){
        // Save the found resource
        light = resource;
        console.log("Light resource saved");
        console.log(JSON.stringify(light, null, 4));
      })

      function updateOnProperty(newValue) { // newValue is of type boolean
        light.properties.state = newValue;
        var newStateString = newValue ? "on" : "off";

        device.updateResource(light).
        then(function() {
          console.log("Turned light " + newStateString);
        }).
        catch(function() {
          console.log("Error turning light " + newStateString);
        })

      }

      var stdin = process.openStdin();
      stdin.addListener("data", function(d) {
        // note:  d is an object, and when converted to a string it will
        // end with a linefeed.  so we (rather crudely) account for that
        // with toString() and then trim()
        var input = d.toString().trim();
        if (input === "on") {
          updateOnProperty(true);
        } else if (input === "off") {
          updateOnProperty(false);
        } else {
          console.log("\nUsage\n Typing \"on\": turn on the light\n Typing \"off\": turns off the light");
        }
      });

    }
  });

  device.findResources();
});
