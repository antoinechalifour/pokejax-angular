//////////////////////////////////////////////////////////////
// Toutes l'application front-end est gérée dans ce fichier //
//////////////////////////////////////////////////////////////

angular.module("Pokejax", ['ngRoute', 'ngAnimate'])

///////////////////////////////////////////////////////////////
//Configration des routes et des vues / controllers associés //
///////////////////////////////////////////////////////////////
.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/pokedex/', {
	    templateUrl: 'partials/pokedex.html',
	    controller: 'pokedexCtrl'
	});
	$routeProvider.when('/pokemon/:numero', {
	    templateUrl: 'partials/pokemon.html',
	    controller: 'pokemonCtrl'
	});
	$routeProvider.when('/search/:searchstring', {
	    templateUrl: 'partials/search.html',
	    controller: 'searchCtrl'
	});
	$routeProvider.when('/compterendu/', {
	    templateUrl: 'partials/compterendu.html',
	    controller: 'compterenduCtrl'
	});
	$routeProvider.otherwise({redirectTo: '/pokedex/'});
}]);