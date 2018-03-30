'use strict';

/**
 * @ngdoc function
 * @name appskeleton.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the appskeleton
 */
angular.module('appskeleton')
  .controller('AboutCtrl', function ($scope, $timeout, $cordovaFileTransfer) {

    $scope.uploadPhoto = function(imageURI) {
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
      ft.upload(imageURI, "http://escale-alb-59370729.ap-south-1.elb.amazonaws.com/profile/uploadPic", function(result){
      console.log(JSON.stringify(result));
      }, function(error){
      console.log(JSON.stringify(error));
      }, options);
    }

    $scope.getImage=function() {
      navigator.camera.getPicture($scope.uploadPhoto, function(message) {
      alert('get picture failed');
      }, {
      quality: 100,
      destinationType: navigator.camera.DestinationType.FILE_URI,
      sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
      });

    }



  });