angular.module("Pokejax")

//////////////////////////////////////////////
// Controller permettant la gestion du menu //
//////////////////////////////////////////////
.controller('menuCtrl', ['$scope', '$location', function($scope, $location){
	$scope.type = 'default';
	$scope.tab = 1;
	$scope.searchfield = "";
	$scope.isSet = function(atab){
		return $scope.tab == atab;
	}
	$scope.setTab = function(atab){
		$scope.searchfield = "";
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

	$scope.isType = function(type){
		return (type === $scope.type);
	}

	$scope.$on('typechanged', function(event, data){
		$scope.type = data;
	});
}])

/////////////////////////////////////////////////
// Controller permettant la gestion du pokedex //
/////////////////////////////////////////////////
.controller('pokedexCtrl', ['$scope', '$http', '$location', 'PokemonsFactory', function($scope, $http, $location, PokemonsFactory){
	$scope.loading = true;
	PokemonsFactory.getPromise()
	.then(function(){
		$scope.pokemons = PokemonsFactory.getPokemons();
		$scope.loading = false;	

		$scope.loadFiche = function(num){
			var intnum = parseInt(num);
			$location.path('/pokemon/' + num);
		}
	}, function(){
		$scope.loading = false;
	});
}])

///////////////////////////////////////////////////////////////
// Controller permettant la gestion de la fiche d'un pokémon //
///////////////////////////////////////////////////////////////
.controller('pokemonCtrl', ['$scope', '$routeParams', '$http', '$rootScope', function($scope, $routeParams, $http, $rootScope){
	$scope.currentpokemon=parseInt($routeParams.numero);
	$scope.loading = true;
	$scope.pokemon = {};
	$scope.nbusers = 0;
	$scope.messages = [];
	var ws = null;
	var clientname = null;

	$scope.checkType = function(type){
		return ($scope.pokemon.types && type === $scope.pokemon.types[0]);
	}

	//////////////////////////////////
	// Charger le pokemon courrant //
	//////////////////////////////////
	$http({
		method: 'GET',
		url: '/api/pokemons/' + $scope.currentpokemon
	})
	.success(function(data, status){
		$scope.pokemon = data;
		$scope.loading = false;
		$rootScope.$broadcast('typechanged', data.types[0]);
	})
	.error(function(data, status){
		$scope.loading = false;
	})
	.then(function(data, status){
		////////////////////////////
		// Gestion du web socket //
		////////////////////////////
		var protocol = (location.protocol == 'https:') ? 'wss://' : 'ws://';
		ws = new WebSocket(protocol + location.host + "/");

		ws.onmessage = function (event) {
			var data = JSON.parse(event.data);
			var type = data.type;
			switch(type){
				/////////////////////////////////////////////////////////////////
				// Initialiser et indiquer au serveur quel pokemon on suit  //
				/////////////////////////////////////////////////////////////////
				case 'init':
					clientname = data.clientname;
					ws.send(JSON.stringify({
						type: 'init',
						pokemon: $scope.currentpokemon
					}));
					break;

				///////////////////////////////////////////////////////////
				// Mise a jour du nb d'utilisateur regardant la fiche //
				///////////////////////////////////////////////////////////
				case 'majuser':
					if(data.who != clientname){
						var msgtodisplay = {}
						msgtodisplay.fromuser = false;
						var userstatus = (data.status == 'connected') ? 'connecté' : 'déconnecté';
						msgtodisplay.msg = "Un " + data.who + " est maintenant " + userstatus + ".";
						$scope.messages.push(msgtodisplay);
					}
					newnb = data.newnb;
					$scope.nbusers = newnb;
					$scope.$apply();
					break;

				case 'message':
					data.fromuser = true;
					$scope.messages.push(data)
					$scope.$apply();
					break
				default: console.log(data);
			}
		};
	});


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
		$rootScope.$broadcast('typechanged', 'default');
		ws.send(JSON.stringify({
			type: 'leaving',
			pokemon: $scope.currentpokemon
		}));
	});
}])

///////////////////////////////////////
// Controller associé à la recherche //
///////////////////////////////////////
.controller('searchCtrl', ['$scope', '$http', '$routeParams', '$location', function($scope, $http, $routeParams, $location){
	var searchstring = $routeParams.searchstring;
	$scope.loading = true;

	$scope.results = {};
	$http({
		method: 'GET',
		url: '/api/pokemons/search/' + searchstring
	})
	.success(function(data, status){
		$scope.results = data;
		$scope.loading = false;
	})
	.error(function(data, status){
		$scope.results.byname = [];
		$scope.results.bytype = [];
		$scope.results.byattaques = [];
		$scope.loading = false;
	});

	$scope.loadFiche = function(num){
		var intnum = parseInt(num);
		$location.path('/pokemon/' + num);
	}
}])

.controller('compterenduCtrl', ['$scope', '$sce', 'CompterenduFactory', function($scope, $sce, CompterenduFactory){
	$scope.compterendu = "";
	CompterenduFactory.getPromise()
	.then(function(data, status){
		$scope.compterendu = $sce.trustAsHtml(data.data);
	});
}]);