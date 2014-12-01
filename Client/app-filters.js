angular.module("Pokejax")

////////////////////////////////////////////////////////////
// Création d'un filtre pour convertir les strings en int //
////////////////////////////////////////////////////////////
.filter('num', function() {
    return function(input) {
      return parseInt(input, 10);
    }
});