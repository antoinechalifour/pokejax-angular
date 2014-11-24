#Compte rendu TP4
##Cross-document messaging
###Lancement
Il est nécessaire de lancer deux serveurs afin de continuer le TP. Pour cela, se placer dans le dossier server1/ et réaliser :
`npm start`

Puis ensuite se placer dans server2/ et réaliser :
`npm start`

Il faut ensuite se rendre sur l'adresse fournie par server1.
###Analyse
Nous souhaitons dans ce TP faire communiquer deux documents HTML provenant de deux serveurs différents : `server1` et `server2`.
Lorsqu'il est lancé, le `server1` livre un index.html contenant une iframe. Cette iframe contient le code html servi par le `server2`. Nous essayons donc de faire communiquer ces deux documents d'origines différentes.

Nous voulons depuis `inner.html` envoyer un message au document parent. Nous utilisons donc la méthode `postMessage('message', 'destination')` en utilisant notre `server1` comme destination.

Le server1 contrôle ensuite l'origine du message et s'i elle correspond à celle du server2, affiche une alert contenant le message.

Un tel système de sécurité permet par exemple de contrôler les messages qui pourraient être envoyés par des bandeaux publicitaires.

##Communications bidirectionnelles avec le serveur (mode push)
Le but de ce TP est de mettre un place un serveur websocket qui permettra :

* de compter les utilisateurs par pokémon
* d'offrir une salle de chat par pokémon

###Côté serveur
Nous rajoutons au serveur une partie websocket grâce au module ws.
La création du serveur s'effectue comme suit :

`var WebSocketServer = require('ws').Server, 
wss = new WebSocketServer({server: server, path: "/"});`

Nous créeons ensuite un tableau de 151 cases représentants les chatrooms des pokémons. Dès lors que nous recevons une connexion, nous lui attribuons un ID, nous demandons au client quel pokémon il regarde - message de type ìnit` - , puis nous ajoutons le socket au chatroom correspondant au pokémon.

Nous analysons ensuite par type de message ce que le client souhaite faire :

* message : il communique via le chat, nous envoyons son messages sur les sockets de la chatroom
* leaving : le client qui la chatroom, nous envoyons le nombre d'utilisateur aux autres.

Lorsque le socket se ferme - `on close` - nous regardons dans chaque chatroom pour supprimer le socket s'il s'y trouve.

###Côté client
Nous ouvrons un socket sur la page de consultation d'un pokémon à l'aide du code suivant `ws = new WebSocket("ws://" + location.host + "/");`.

De la, le serveur nous renvoie un message de type `init`, auquel le client répond avec le numéro du pokémon. Le serveur renvoie ensuite un nom d'utilisateur et nous pouvons envoyer nos messages.

##Autres points
Nous utilisons ici Angular-js qui permet une meilleure organisation du code. Nous pouvons en particulier remarquer :

* la récupération des pokémons via une factory : la liste n'est récupérée qu'une fois lors de la navigation sur le site
* de même pour le compte rendu
* nous utilisons des promises pour synchroniser les controllers qui doivent afficher les vues après avoir reçu les contenus des requêtes HTTP.