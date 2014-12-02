var pokedex = require('./pokedex.json');
pokedex.sort(function(a, b){
	return (parseInt(a.numero) < parseInt(b.numero)) ? -1 : 1;
});

pokedex = pokedex.map(function(pokemon){
	pokemon.types = [];
	pokemon.groupoeufs = [];
	pokemon.capspes = [];

	pokemon.types.push(pokemon.type1);
	if(pokemon.type2) pokemon.types.push(pokemon.type2);

	pokemon.groupoeufs.push(pokemon.groupoeuf1);
	if(pokemon.groupoeuf2) pokemon.groupoeufs.push(pokemon.groupoeuf2);
	if(pokemon.groupoeuf3) pokemon.groupoeufs.push(pokemon.groupoeuf3);

	pokemon.capspes.push(pokemon.capspe1);
	if(pokemon.capspe2) pokemon.capspes.push(pokemon.capspe2);
	if(pokemon.capspe3) pokemon.capspes.push(pokemon.capspe3);

	return pokemon;
});

//Nous sommes obligés de redéfinir la fonctions puisque quelques pokémons sont manquant et nous avons donc des trous dans le pokédex...
pokedex.getPokemon = function(numero){
	return pokedex.filter(function(pokemon){
		if(parseInt(pokemon.numero) == numero) return true;
		else
			return false;
	})[0];
};

module.exports = pokedex;