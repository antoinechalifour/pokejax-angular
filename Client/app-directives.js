angular.module("Pokejax")

///////////////////////////////////////////////////////////////////////////
// Création de l'élément <menu></menu> et de la vue / controller associé //
///////////////////////////////////////////////////////////////////////////
.directive('menu', [function(){
	return {
		restrict: 'E',
		templateUrl: 'partials/menu.html',
		controller: 'menuCtrl'
	};
}]);