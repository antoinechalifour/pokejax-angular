angular.module("Pokejax")

///////////////////////////////////////////////
//Factory permettant la gestion des pokémons //
///////////////////////////////////////////////
.factory('PokemonsFactory', ['$http', function($http){
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
}])

.factory('CompterenduFactory', ['$http', function($http){
	var compterendu = "";

	var promise = $http({
		method: 'GET',
		url: '/api/compterendu/'
	})
	.success(function(data, status){
		compterendu = data;
	})
	.error(function(data, status){
		console.log('error');
	});

	return {
		getCompterendu : function(){
			return compterendu;
		},

		getPromise: function(){
			return promise;
		}
	}
}]);