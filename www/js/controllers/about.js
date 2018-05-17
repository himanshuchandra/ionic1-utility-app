'use strict';

/**
 * @ngdoc function
 * @name appskeleton.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the appskeleton
 */
angular.module('appskeleton')
  .controller('AboutCtrl', function ($scope, $timeout, $cordovaCamera, $cordovaFile, $cordovaFileTransfer, $cordovaDevice, $ionicPopup, $cordovaActionSheet, $cordovaGeolocation, $ionicPlatform) {

    $scope.uploadPhoto = function (imageURI) {
      var options = new FileUploadOptions();
      options.fileKey = "file";
      options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
      options.mimeType = "image/jpeg";
      console.log(options.fileName);
      var params = new Object();
      params.value1 = "test";
      params.value2 = "param";
      options.params = params;
      options.chunkedMode = false;

      var ft = new FileTransfer();
      ft.upload(imageURI, "http://escale-alb-59370729.ap-south-1.elb.amazonaws.com/profile/uploadPic", function (result) {
        console.log(JSON.stringify(result));
      }, function (error) {
        console.log(JSON.stringify(error));
      }, options);
    }

    $scope.getImage = function () {
      navigator.camera.getPicture($scope.uploadPhoto, function (message) {
        alert('get picture failed');
      }, {
          quality: 100,
          destinationType: navigator.camera.DestinationType.FILE_URI,
          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
        });

    }

    ////////////////////////////

    $scope.showAlert = function (title, msg) {
      var alertPopup = $ionicPopup.alert({
        title: title,
        template: msg
      });
    };

    $scope.loadImage = function () {
      var options = {
        title: 'Select Image Source',
        buttonLabels: ['Load from Library', 'Use Camera'],
        addCancelButtonWithLabel: 'Cancel',
        androidEnableCancelButton: true,
      };
      $cordovaActionSheet.show(options).then(function (btnIndex) {
        var type = null;
        if (btnIndex === 1) {
          type = Camera.PictureSourceType.PHOTOLIBRARY;
        } else if (btnIndex === 2) {
          type = Camera.PictureSourceType.CAMERA;
        }
        if (type !== null) {
          $scope.selectPicture(type);
        }
      });
    };

    $scope.selectPicture = function (sourceType) {
      var options = {
        quality: 100,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: sourceType,
        saveToPhotoAlbum: false
      };

      $cordovaCamera.getPicture(options).then(function (imagePath) {
        // Grab the file name of the photo in the temporary directory
        var currentName = imagePath.replace(/^.*[\\\/]/, '');

        //Create a new name for the photo
        var d = new Date(),
          n = d.getTime(),
          newFileName = n + ".jpg";

        // If you are trying to load image from the gallery on Android we need special treatment!
        if ($cordovaDevice.getPlatform() == 'Android' && sourceType === Camera.PictureSourceType.PHOTOLIBRARY) {
          window.FilePath.resolveNativePath(imagePath, function (entry) {
            window.resolveLocalFileSystemURL(entry, success, fail);
            function fail(e) {
              console.error('Error: ', e);
            }

            function success(fileEntry) {
              var namePath = fileEntry.nativeURL.substr(0, fileEntry.nativeURL.lastIndexOf('/') + 1);
              // Only copy because of access rights
              $cordovaFile.copyFile(namePath, fileEntry.name, cordova.file.dataDirectory, newFileName).then(function (success) {
                $scope.image = newFileName;
              }, function (error) {
                $scope.showAlert('Error', error.exception);
              });
            };
          }
          );
        } else {
          var namePath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
          // Move the file to permanent storage
          $cordovaFile.moveFile(namePath, currentName, cordova.file.dataDirectory, newFileName).then(function (success) {
            $scope.image = newFileName;
          }, function (error) {
            $scope.showAlert('Error', error.exception);
          });
        }
      },
        function (err) {
          // Not always an error, maybe cancel was pressed...
        })
    };

    // Returns the local path inside the app for an image
    $scope.pathForImage = function (image) {
      if (image === null) {
        return '';
      } else {
        return cordova.file.dataDirectory + image;
      }
    };

    $scope.uploadImage = function() {
      // Destination URL
      var url = "http://escale-alb-59370729.ap-south-1.elb.amazonaws.com/profile/uploadPic";

      // File for Upload
      var targetPath = $scope.pathForImage($scope.image);

      // File name only
      var filename = $scope.image;;

      var options = {
        fileKey: "file",
        fileName: filename,
        chunkedMode: false,
        mimeType: "multipart/form-data",
        params : {'fileName': filename}
      };

      $cordovaFileTransfer.upload(url, targetPath, options).then(function(result) {
        $scope.showAlert('Success', 'Image upload finished.');
      });
    }

    $scope.cLat;
    $scope.cLong;

    ////tracking
    var socket = io('http://ed5dad15.ngrok.io');

    $scope.updatePos = function(){
      console.log('ping');
      $ionicPlatform.ready(function () {
        var posOptions = { timeout: 10000, enableHighAccuracy: true };

        $cordovaGeolocation
          .getCurrentPosition(posOptions)
          .then(function (position) {
            console.log(position);
            if(position && ($scope.cLat !== position.coords.latitude || $scope.cLong !== position.coords.longitude)){
              socket.emit('transmitLocation',{Longitude:position.coords.longitude,Latitude:position.coords.latitude});
              $scope.cLat = position.coords.latitude;
              $scope.cLong = position.coords.longitude;
            }
          }, function (err) {
            console.log(err);
          });
      });
    }

    $scope.nearMe = function () {
      console.log('start');
      setInterval(function(){
        $scope.updatePos();
      }, 5000);
    };

    $scope.checkDeviceSetting = function () {
      cordova.plugins.diagnostic.isGpsLocationEnabled(function (enabled) {
        console.log("GPS location setting is " + (enabled ? "enabled" : "disabled"));
        if (!enabled) {
          cordova.plugins.locationAccuracy.request(function (success) {
            console.log("Successfully requested high accuracy location mode: " + success.message);
            $scope.nearMe();
          }, function onRequestFailure(error) {
            console.error("Accuracy request failed: error code=" + error.code + "; error message=" + error.message);
            if (error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED) {
              if (confirm("Failed to automatically set Location Mode to 'High Accuracy'. Would you like to switch to the Location Settings page and do this manually?")) {
                cordova.plugins.diagnostic.switchToLocationSettings();
              }
              else {
                $scope.nearMe();  // still try getting location and handle itself
              }
            }
            else {
              $scope.nearMe();  // still try getting location and handle itself
            }
          }, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
        }
        else {
          $scope.nearMe();  // still try getting location and handle itself
        }
      }, function (error) {
        console.error("The following error occurred: " + error);
        $scope.nearMe();  // still try getting location and handle itself
      });
    }

    $scope.checkAuthorization = function () {
      cordova.plugins.diagnostic.isLocationAuthorized(function (authorized) {
        console.log("Location is " + (authorized ? "authorized" : "unauthorized"));
        if (authorized) {
          $scope.checkDeviceSetting();
        }
        else {
          cordova.plugins.diagnostic.requestLocationAuthorization(function (status) {
            switch (status) {
              case cordova.plugins.diagnostic.permissionStatus.GRANTED:
                console.log("Permission granted");
                $scope.checkDeviceSetting();
                break;
              case cordova.plugins.diagnostic.permissionStatus.DENIED:
                console.log("Permission denied");
                // User denied permission
                $scope.nearMe();  // still try getting location and handle itself
                break;
              case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
                console.log("Permission permanently denied");
                // User denied permission permanently
                $scope.nearMe();  // still try getting location and handle itself
                break;
            }
          }, function (error) {
            console.error(error);
            $scope.nearMe();  // still try getting location and handle itself
          });
        }
      }, function (error) {
        console.error("The following error occurred: " + error);
        $scope.nearMe();  // still try getting location and handle itself
      });
    }

    $scope.checkGps = function () {
      cordova.plugins.diagnostic.isGpsLocationAvailable(function (available) {
        console.log("GPS location is " + (available ? "available" : "not available"));
        if (!available) {
          $scope.checkAuthorization();
        }
        else {
          console.log("GPS location is ready to use");
          $scope.nearMe();
        }
      }, function (error) {
        console.log(error);
        $scope.nearMe();  // still try getting location and handle itself
      });
    }
    $scope.checkGps();


  });
