var app = angular.module("Pokejax", []);

app.config(['$routeProvider', function($routeProvider) {
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
	    templateUrl: 'partials/compterendu.html'
	});
	$routeProvider.otherwise({redirectTo: '/pokedex/'});
}]);

app.filter('num', function() {
    return function(input) {
      return parseInt(input, 10);
    }
});

app.directive('menu', [function(){
	return {
		restrict: 'E',
		templateUrl: 'partials/menu.html',
		controller: 'menuCtrl'
	};
}]);

app.factory('PokemonsFactory', ['$http', function($http){
	var pokemons = [];
	var promise = $http({
		method: 'GET',
		url: '/api/pokemons'
	})
	.success(function(data, status){
		pokemons = data;
	})
	.error(function(data, status){

	});

	return {
		getPokemons: function(){
			return pokemons;
		},
		getPromise: function(){
			return promise;
		}
	}
}]);

app.controller('menuCtrl', ['$scope', '$location', function($scope, $location){
	console.log("Controlleur menu");

	$scope.tab = 1;
	$scope.searchfield = "";
	$scope.isSet = function(atab){
		return $scope.tab == atab;
	}
	$scope.setTab = function(atab){
		$scope.tab = atab;
	}

	$scope.search = function(){
		if($scope.searchfield.length == 0){
			$location.path('/pokedex');
		}
		else {
			$location.path('/search/' + $scope.searchfield);
		}
	}
}]);

app.controller('pokedexCtrl', ['$scope', '$http', '$location', 'PokemonsFactory', function($scope, $http, $location, PokemonsFactory){
	console.log('Pokedex controller');
	PokemonsFactory.getPromise()
	.then(function(){
		$scope.pokemons = PokemonsFactory.getPokemons();	

		$scope.loadFiche = function(num){
			var intnum = parseInt(num);
			$location.path('/pokemon/' + num);
		}
	});
}]);

app.controller('pokemonCtrl', ['$scope', '$routeParams', '$http', function($scope, $routeParams, $http){
	console.log("Pokemon controller")
	$scope.currentpokemon=parseInt($routeParams.numero);
	$scope.pokemon = {};
	$scope.nbusers = 0;
	$scope.messages = [];

	//////////////////////////////////
	// Charger le pokemon courrant //
	//////////////////////////////////
	$http({
		method: 'GET',
		url: '/api/pokemons/' + $scope.currentpokemon
	})
	.success(function(data, status){
		$scope.pokemon = data;
	})
	.error(function(data, status){
		console.log('ko');
	});

	////////////////////////////
	// Gestion du web socket //
	////////////////////////////
	console.log("> Creation du websocket")
	var ws = new WebSocket('ws://localhost:8080/');
	var clientname = null;

	ws.onmessage = function (event) {
		var data = JSON.parse(event.data);
		var type = data.type;
		switch(type){
			/////////////////////////////////////////////////////////////////
			// Initialiser et indiquer au serveur quel pokemon on suit  //
			/////////////////////////////////////////////////////////////////
			case 'init':
				clientname = data.clientname;
				console.log('> Envoi du pokemon suivi par ' + clientname);
				ws.send(JSON.stringify({
					type: 'init',
					pokemon: $scope.currentpokemon
				}));
				break;

			///////////////////////////////////////////////////////////
			// Mise a jour du nb d'utilisateur regardant la fiche //
			///////////////////////////////////////////////////////////
			case 'majuser':
				console.log("> Mis a jour du nombre d'utilisateurs " + data.newnb);
				newnb = data.newnb;
				$scope.nbusers = newnb;
				$scope.$apply();
				break;

			case 'message':
				console.log("> Nouveau message reçu : " + data.message);
				$scope.messages.unshift(data)
				$scope.$apply();
				break
			default: console.log(data);
		}
	};



	$scope.sendMessage = function(){
		var message = $scope.message;
		ws.send(JSON.stringify({
			clientname: clientname,
			pokemon: $scope.currentpokemon,
			type: 'message',
			message: message
		}));
		$scope.message = "";
	};

	$scope.$on('$destroy', function(){
		console.log("Leaving room");
		ws.send(JSON.stringify({
			type: 'leaving',
			pokemon: $scope.currentpokemon
		}));
	});
}]);

app.controller('searchCtrl', ['$scope', '$http', '$routeParams', '$location', function($scope, $http, $routeParams, $location){
	var searchstring = $routeParams.searchstring;

	$scope.results = {};
	$http({
		method: 'GET',
		url: '/api/pokemons/search/' + searchstring
	})
	.success(function(data, status){
		$scope.results = data;
	})
	.error(function(data, status){
		$scope.results.byname = [];
		$scope.results.bytype = [];
		$scope.results.byattaques = [];
	});

	$scope.loadFiche = function(num){
		var intnum = parseInt(num);
		$location.path('/pokemon/' + num);
	}
}]);