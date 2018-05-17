

/**
 * @ngdoc function
 * @name appskeleton.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the appskeleton
 */
angular.module('appskeleton')
  .controller('MainCtrl', function ($scope, $ionicPlatform, $cordovaTouchID) {

    $scope.scanFinger = function () {
      alert("1");
      $ionicPlatform.ready(function () {
        // Is available
        if (typeof window.Fingerprint != 'undefined') {
          window.Fingerprint.isAvailable(isAvailableSuccess, isAvailableError);
          $scope.available = "Not checked";

          function isAvailableSuccess(result) {
            alert("present");
            $scope.available = true;
          }

          function isAvailableError(message) {
            alert("notPresent");
            $scope.available = "isAvailableError(): " + JSON.stringify(message);
            console.error(message);
          }

          if ($scope.available) {
            Fingerprint.show({
              clientId: "Fingerprint-Demo",
              clientSecret: "password" //Only necessary for Android
            }, successCallback, errorCallback);

            function successCallback() {
              alert("Authentication successfull");
            }

            function errorCallback(err) {
              alert("Authentication invalid " + err);
            }
          }
          else {
            alert($scope.available);
          }

        }
      });
    };

    $scope.scanIos = function () {
      $cordovaTouchID.checkSupport().then(function () {
        // success, TouchID supported
      }, function (error) {
        alert(error); // TouchID not supported
      });

      $cordovaTouchID.authenticate("text").then(function () {
        // success
      }, function () {
        // error
      });
    };

    ///////////Image capture
    var captureSuccess = function (mediaFiles) {
      alert("success");
      console.log(mediaFiles);
      // var i, len;
      // for (i = 0, len = mediaFiles.length; i < len; i += 1) {
      //     uploadFile(mediaFiles[i]);
      // }
    }

    var captureError = function (error) {
      var msg = 'An error occurred during capture: ' + error.code;
      alert(msg, 'Uh oh!');
    }

    $scope.clickPic = function () {
      // Launch device camera application,
      // allowing user to capture up to 2 images
      navigator.device.capture.captureImage(captureSuccess, captureError, { limit: 1 });

    }

    $scope.cLat;
    $scope.cLong;

    var move = function (data) {
      if (data && ($scope.cLat !== data.Latitude || $scope.cLong !== data.Longitude)) {
        $scope.cLat = data.Latitude;
        $scope.cLong = data.Longitude;
        var ncenter = {
          latitude: data.Latitude,
          longitude: data.Longitude
        };

        var nmarker = {
          id: 0,
          coords: {
            latitude: data.Latitude,
            longitude: data.Longitude
          }
        };
        $scope.map.marker = nmarker;
        $scope.map.center = ncenter;
        $scope.map.zoom = 13;

        if (!$scope.$$phase) {
          $scope.$apply();
        }
      }
    }

    var updateMap = function () {
      console.log('listening to socket');

      this.socket = io("http://13.127.248.47:8080");
      this.socket.on('recieveLocation', (data) => {
        console.log(data);
        move(data);
      });

    }

    angular.extend($scope, {
      map: {
        center: {
          latitude: 28.7041,
          longitude: 77.1025
        },
        zoom: 13,
        marker: {
          id: 0,
          coords: {
            latitude: 28.63700,
            longitude: 77.280049,
          }
        }
      }
    });

    updateMap();

  });
