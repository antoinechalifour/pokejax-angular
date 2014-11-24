/////////////////////////////////////////////////
// Auteurs : Pierre Latour & Antoine Chalifour //
/////////////////////////////////////////////////


// Import des modules et fichiers nécessaires, notamment :
//  - Express : pour la création du serveur
//  - bodyParser : pour parser les requêtes
//  - logger : pour logger
//  - le pokedex
//  - un array de natures (pour générer des pseudos dans le chat)
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('winston');

var natures = require('./natures.json')
logger.info('[Configuration] > Import et tri du pokedex...');
var pokedex = require('./pokedex.json');
pokedex.sort(function(a, b){
	return (parseInt(a.numéro) < parseInt(b.numéro)) ? -1 : 1;
});
;

///////////////////////////////
// Configuration  du serveur //
///////////////////////////////
app.use(bodyParser.json());

var client = '/Client';
logger.info('[Configuration] > Utilisation du client ' + client);
app.use('/', express.static(__dirname + client));

///////////////////////
//Fonctions diverses //
///////////////////////
function compareStr(str1, str2){
	if(str1.toLowerCase().indexOf(str2.toLowerCase()) == -1) return false;
	else return true;
}

////////////
// Routes //
////////////

// Renvoie l'ensemble des pokémons
app.get('/api/pokemons/', function(req, res){
	logger.info('[HttpServer] > Demande de la liste des pokémons.');
	var pokemons = pokedex.map(function(pokemon){
		return {
			"num" : pokemon.numéro,
			"nom": pokemon.nom
		}
	});
	res.status(200).send(JSON.stringify(pokemons));
});

// Renvoie le pokémon dont le nom est donné en paramètres
app.get('/api/pokemons/:id', function(req, res){
	var id = req.params.id;
	logger.info('[HttpServer] > Demande du pokémon : ' + id);

	var pokemon = pokedex.filter(function(pokemon){
		return (parseInt(pokemon.numéro) == parseInt(id));
	});

	if(pokemon.length){
		logger.info('> [200] Pokemon trouvé : ' + pokemon[0].nom);
		res.status(200).send(JSON.stringify(pokemon[0]));
	}
	else{
		logger.info('> [404] Pokemon non trouvé : ' + id);
		res.status(404).send(JSON.stringify({"msg" : "Pokemon non trouvé"}));
	}
});

// Recherche un pokémon à partir d'une chaine de caractères
// On recherche : 
// 	- sur le nom
// 	- sur le type
// 	- sur les attaques
app.get('/api/pokemons/search/:searchstring', function(req, res){
	var searchstring = req.params.searchstring;
	logger.info('[HttpServer] > Recherche du pokémon : ' + searchstring);

	//Recherche par nom
	var byname = pokedex
	.filter(function(pokemon){
		return compareStr(pokemon.nom, searchstring);
	})
	.map(function(pokemon){
		return {
			"num" : pokemon.numéro,
			"nom": pokemon.nom
		};
	});

	var bytype = pokedex
	.filter(function(pokemon){
		return (compareStr(pokemon.type1, searchstring) 
			|| (pokemon.type2 && compareStr(pokemon.type2, searchstring)));
	})
	.map(function(pokemon){
		var matchingtype = "";
		if(compareStr(pokemon.type1, searchstring)) matchingtype = pokemon.type1;
		else matchingtype = pokemon.type2;
		return {
			"type" : matchingtype,
			"num" : pokemon.numéro,
			"nom": pokemon.nom
		};
	});

	var byattaques = pokedex
	.map(function(pokemon){
		var attaques = [];
		pokemon.attaques.forEach(function(attaque){
			if(compareStr(attaque.nom, searchstring)){
				attaques.push(attaque);
			}
		});

		if(attaques.length){
			return {
				"attaques": attaques,
				"num" : pokemon.numéro,
				"nom": pokemon.nom
			}
		}
	})
	.filter(function(pokemon){
		return (pokemon != null);
	});

	var pokeretour = {}
	pokeretour.byname = byname;
	pokeretour.bytype = bytype;
	pokeretour.byattaques = byattaques;

	if(pokeretour.byname.length || pokeretour.bytype.length || pokeretour.byattaques.length){
		res.status(200).send(JSON.stringify(pokeretour));
	}
	else{
		logger.warn('> Aucun pokémon trouvé.');
		res.status(404).send(JSON.stringify({"msg" : "Aucun pokémon trouvé"}));
	}
	
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	logger.info('[HttpServer] > Aucune route trouvée');
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//Lancement du serveur
app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function() {
  logger.info('Serveur lancé. Si en local, adresse : http://localhost:' + server.address().port);
});




///////////////////////
// Serveur Websocket //
///////////////////////
var WebSocketServer = require('ws').Server, 
wss = new WebSocketServer({server: server, path: "/"}); 
logger.info('[WebSocketServer] -- WebSocket serveur lancé sur le port 8080');
Array.prototype.repeat = function(L){
	while(L) this[--L]= [];
	return this;
}
var chatrooms = [].repeat(151);
var usersids = 0;

//Lorsque le serveur reçoit une connexion -> il renvoie l'id de l'utilisateur
wss.on('connection', handleConnexion);

function handleConnexion(ws){
	ws.connectionID = usersids;
	usersids++;
	logger.info('> Nouvelle connexion ' + ws.connectionID);

	//Génération d'un nom d'utilisateur
	var randomPokemon = Math.floor(Math.random() * (pokedex.length-1));
	var randomNature = Math.floor(Math.random() * (natures.length-1));
	var clientname = pokedex[randomPokemon].nom + " " + natures[randomNature];

	//On envoie l'identifiant à la personne
	//On lui demande le pokémon qu'elle consulte
	var data = {
		type: 'init',
		clientname: clientname
	};
	ws.send(JSON.stringify(data));

	//On analyse le type de message
	ws.on('message', function(datatxt){
		var data = JSON.parse(datatxt);
		switch(data.type){
			case 'init':
				handleInit(ws, data);
				break;
			case 'message':
				handleMessage(data);
				break;
			case 'leaving':
				handleLeaving(ws, data);
				break;
		}
	});

	//Socket fermé
	ws.on('close', function(ws){
		logger.info('[onClose] > Client déconnecté');
		//On cherche pour toutes les chatrooms l'id du socket et on la supprime
		chatrooms.forEach(function(chatroom){
			var i = chatroom.indexOf(ws, 1);
			if(i >= 0) {
				chatroom.splice(i, 1);
				majUser(chatroom);
			}
		});
	});
}

function handleInit(ws, data){
	logger.info('[handleInit] > Un utilisateur suit le pokemon ' + pokedex[data.pokemon - 1].nom);
	// Si l'utilisateur donne un pokémon
	var chatroom = chatrooms[data.pokemon - 1];

	chatroom.push(ws);
	majUser(chatroom);
}

function handleMessage(data){
	logger.info('> Nouveau message reçu : ' + data.message);
	var chatroom = chatrooms[data.pokemon - 1];
	chatroom.forEach(function(client, index){
		try{
			client.send(JSON.stringify({
				type: 'message',
				message: data.message,
				from: data.clientname
			}));
		}
		catch(err){
			logger.info('[handleMessage] > Client deconnecté');
		}
	});
}

function handleLeaving(ws, data){
	logger.info('> Un client a quitté la room ' + pokedex[data.pokemon - 1].nom);
	var i = chatrooms[data.pokemon - 1].indexOf(ws);
	if(i >= 0) {
		chatrooms[data.pokemon - 1].splice(i, 1);
		majUser(chatrooms[data.pokemon - 1]);
	}
}

function majUser(chatroom){
	chatroom.forEach(function(user){
		try{
			user.send(JSON.stringify({
				type: 'majuser',
				newnb: chatroom.length
			}));
		}
		catch(err){
			logger.info('[majUser] > Client deconnecté');
		}
	});
}