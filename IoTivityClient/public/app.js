'use strict';

// Declare app level module which depends on views, and components
angular.module('IoTivityControlCenter', [
  'IoTivityControlCenter.socket'
]).
controller('MainCtrl', function($scope, socket) {
  $scope.resourcelist = [];
  $scope.selectedIndex = 0;
  $scope.selectedItem = {}
  $scope.spinRefresh = false;

  socket.on('resourcelist', function(reslist) {
    console.log(reslist);
    $scope.spinRefresh = false; // Stop spinning in case of refresh
    $scope.resourcelist = reslist.map(addPropertyTypesToResource);
    $scope.selectedItem = $scope.resourcelist[$scope.selectedIndex];
  });

  $scope.setCurrentResource = function(index) {
    $scope.selectedIndex = index;
    $scope.selectedItem = $scope.resourcelist[index];
  }

  var addPropertyTypesToResource = function(resource){
    resource.propertyTypes = {};
    for (var key in resource.properties) {
      if (resource.properties.hasOwnProperty(key)) {
        resource.propertyTypes[key] = typeof resource.properties[key];
      }
    }
    return resource;
  }

  $scope.discoverIoTivityResources = function(){
    $scope.spinRefresh = true; // Start spinning of the refresh icon
    socket.emit('refresh');
  }

  $scope.updateCurrentItem = function(){
    socket.emit('resource:update', $scope.selectedItem);
  }

  $scope.setPropertyAndUpdateCurrentItem = function(newValue, currentItem, property){
    currentItem.properties[property] = newValue;
    $scope.updateCurrentItem();
  }

  $scope.toggleObserveOnCurrentResource = function(){
    socket.emit('resource:observe', $scope.selectedItem);
  }

});
