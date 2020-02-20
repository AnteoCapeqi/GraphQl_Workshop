# GraphQl_Workshop
Ce repo a pour objectif de vous aider a aprehender les concept de GraphQL et de postgresql.
N'hesitez pas a me renvoyer vos avis et retour, je serais ravis d'upgrade le repo pour faciliter sa compréhension.

## Prérequis
- Installer NodeJs
- Installer Nodeamon
- Installer Babel ( Plus les Presets)

###### Tous cela se trouve dans le repo de base a télécharger.

## 1 - Setup de base d'Appolo Server avec Express
On va ici utiliser Appolo Server avec Express. Il existe de nombreuses
libraires que l'on peut employé mais mon choix c'est porté sur ceux la car c'est
sur eux que j'ai trouvé le plus de documentation et de tuto.

#### Appolo Server

``npm install apollo-server apollo-server-express --save``

#### Express

``npm install express graphql --save ``

#### Premiers pas

Pour commencer on va déjà les importer dans notre fichier '*index.js*'

```
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
```
Ensuite nous allons utiliser la fonction *applyMiddleware* pour lancer notre serveur
avec Express.
Pour cela nous allons créer une variable *server* dans laquelle on initialise notre
serveur Appolo avec un *schemas* et un *resolvers* (Nous les implémenterons un peu
plus tard.)
```
const app = express();
const schema = ...
const resolvers = ...
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
});
server.applyMiddleware({ app, path: '/graphql' });
app.listen({ port: 8001 }, () => {
  console.log('Apollo Server on http://localhost:8001/graphql');
});
```
Passons au schema. Le schemas consiste en un ensemble de type definition
(Des données qui ont donc une fonction prédéfinies comme un objet, query ,scalar,...)
Nous avons donc ici un Query type avec un champ **me** de type **User** et ou **User** a comme champ un scalar type nommé **username**(Ici un string).
```
const schema = gql`
  type Query {
    me: User
  }
  type User {
    username: String!
  }
`;
```
On importe le format graphql avec Appolo-server-express
```
import { ApolloServer, gql } from 'apollo-server-express';
```
Passons a notre resolver. Le resolver permet de récupérer les données qui composent
notre schema.
La source de donnée n'est pas importante, elle peuvent venir d'une base de donnée ou d'une autre Api.
Ce qui est le point de fort de graphql par rapport au autres langages de base de donnée.

Les resolvers sont des fonctions qui renvoient les données de nos champs graphql dans le schema. Ici le resolver ne renvoie qu'un seul objet **User** appelé *Martin Malin*.

```
const resolvers = {
  Query: {
    me: () => {
      return {
        username: 'Martin Malin',
      };
    },
  },
};
```
Cela fait notre Api devrait fonctionner sur le port 8001. On tape donc dans notre navigateur *http://localhost:8000/graphql*

On introduis ensuite notre premiere query
```
{
  me {
    username
  }
}
```
Si on nous renvoie une donnée **me** avec comme **username** *Martin Malin* alors tout est bon
et nous pouvons continuer.

#### Cors

Cette partie est ***optionnelle***, mais j’apprécie beaucoup cors. Cors est un acronyme
pour **Cross-Origin Resource Sharing** ce qui ici va nous permettre d’émuler des requêtes Http depuis d'autre domaine que le notre.

On installe Cors
```
npm install cors --save
```
On ajoute donc notre import dans index.js
```
import cors from 'cors';
```
Et on ajoute cors a notre middleware express.
```
app.use(cors());
```

## 2 - Types definition

#### Le point d'exclamation

Dans cette section on va voir les types définition et la manière dont elle définisse
notre schéma. Un schéma Graphql est définis par ces Types, les relations entre eux et
leurs structure. Par conséquent Graphql utilise un **Shema Defition Langage**(SDL)
Cependant le schéma ne définis la provenance de nos données, ce rôle est laissé au
resolver.

Dans notre schéma vous pouvez remarquez le point d'exclamation pour le champ username.
Cela signifie qu'il ne peut être ni null ni indéfinis.

On va ajouter un champ a notre schéma et utiliser les argument Graphql pour gérer notre champ user.
```
const schema = gql`
  type Query {
    me: User
    user(id: ID!): User
  }
```
Les arguments Graphql sont très utiles pour affiner nos query. Nous devons aussi définir le type, qui dans ce cas est un Id non nul pour récupérer notre user.
Notre query nous renvoie donc un User type qui peut être nul car une entité user sans id valable peut être trouvé.
```
type User {
    id: ID!
    username: String!
  }
```

Une fois que nous avons setup notre schéma nous pouvons ensuite nous occupé de notre resolver.On va donc créer un resolver pour notre User.

```
const resolvers = {
  Query: {
    me: () => {
      return {
        username: 'Martin Malin',
      };
    },
    user: () => {
      return {
        username: 'Pépé LePutois',
      };
    },
  },
};
```
Ensuite nous allons profiter de l'argument id qui arrive de notre query pour décider quel User renvoyé. tous les arguments sont dans le second argument de notre fonction.
```
user: (parent, args) => {
      return {
        username: 'Pépé LePutois',
      };
    },
  },
};
```
Le premier argument appelé parent ne doit pas vous inquietez maintenant on verra plus loin comment l'utiliser.
Maintenant pour rendre notre expemple plus parlant nous allons creer une map avec un sample d'user et renvoyer un user avec l'id approprié.
```
let users = {
  1: {
    id: '1',
    username: 'Martin Malin',
  },
  2: {
    id: '2',
    username: 'Pépé LePutois',
  },
};
const me = users[1];
const resolvers = {
  Query: {
    user: (parent, { id }) => {
      return users[id];
    },
    me: () => {
      return me;
    },
  },
};
```
Essayons maintenant nos query sur le playground.
```
{
  user(id: "2") {
    username
  }
  me {
    username
  }
}
```
On nous renvoie bien deux entités différentes. Merci les arguments graphql ;-)

#### Une liste d'users

Nous allons maintenant creer une troisieme query qui va nous permettre d'afficher une liste de l'ensemble de nos users.
```
const schema = gql`
  type Query {
    users: [User!]
    user(id: ID!): User
    me: User
  }
```
Ici notre query va nous donc nous renvoyez une liste d'users (grâce au brackets carré).
Dans cette liste aucun user ne peut être nul mais la liste peut revenir nul.(Sinon nous aurions pu indiquer **[User!]!**).
Passons a notre resolver.
```
const resolvers = {
  Query: {
    users: () => {
      return Object.values(users);
    },
    user: (parent, { id }) => {
      return users[id];
    },
    me: () => {
      return me;
    },
  },
};
```
Nous avons maintenant 3 query qui peuvent être utilisée dans dans notre Graphql Background. Toutes opèrent sur le même type User et ont chacune un resolvers propres.
Toutes nos query sont regroupé dans sous une seule query type qui liste toutes les query de notre Grapqhql Api.
## 3 - Le resolver
#### Resolver par champ

Dans cette section nous allons nous intéresser au coté resolver de notre schéma GraphQl avec Appolo server. Dans notre schéma nous avons définis des types, leurs relation et leur structure mais rien sur comment récupérer nos data. Voila ou notre resolvers arrive en scène.
En js les resolvers sont groupé dans un objet Javascript souvent appelé le resolver map.
Tous les query de notre query type doivent avoir un resolver.

On va maintenant voir comment créer un resolver pour un champ.
```
const resolvers = {
  Query: {
    users: () => {
      return Object.values(users);
    },
    user: (parent, { id }) => {
      return users[id];
    },
    me: () => {
      return me;
    },
  },
  User: {
    username: () => 'Ronflex',
  },
};
```
On va ensuite demander une liste de nos users sur le playground.
```
{
  users {
    username
    id
  }
}
```
On peut remarquez que le résultat nous affiche des *usernames* **Ronflex** pour chaque user.
Les resolvers peuvent agir sur des champs et ecraser les datas existantes, ici on a écraser le champ username avec notre resolvers.
Si on ne donne aucune instructions sur le champ il prendra la valeur par défaut de User.

#### Les arguments
##### L'Argument parent
Continuons avec les arguments de nos resolvers. Précédemment nous avons vu que le second arguments de notre fonction récupère l'argument qui est retourné d'une query. C'est comme cela que nous avons pu récupérer notre id pour notre user depuis notre query.
``user: (parent, { id })``
Le premier argument est appelé l'argument parent(ou root argument) et il renvoie toujours le champ résolu précédemment. Regardons ensemble le nouveaux resolver pour notre champ username.
```
User: {
    username: parent => {
      return parent.username;
    }
```
On peut voir dans le playground que nos username sont retouné a la normale. Notre resolver va donc allé résoudre le resolver User avant de résoudre le username, nous avons donc les username de notre objet user.
Pour être plus explicite dans notre resolver on peut remplacer '**parent**' par '**user**'.
```
User: {
    username: user => {
      return user.username;
    }
```
Dans ce cas si notre resolver n'est pas très utile car il reproduit le fonctionnement par défaut de notre GraphQl resolver.
Mais nous pouvons constater que ce resolvers nous apporte beaucoup de flexibilité avec nos data.
Nous pouvons récupérer des donnée et les manipuler plus facilement.
```
const resolvers = {
  ...
  User: {
    username: user => `${user.firstname} ${user.lastname}`,
  },
};
```
Comme ici ou l'on affiche notre username avec le nom et prénom grâce a un template.
Nous allons laissé le resolvers username de coté pour l'instant car il ne fait que reproduire le fonctionnement par défaut d'Appolo server.
Ils sont appelé les resolver par défaut.
##### L'argument context
Regardons ensuite les autres arguments que notre fonction peut avoir
```
(parent, args, context, info) => { ... }
```
Notre troisième argument ici est le **context**. Le contexte est très pratique car il nous permet de récupérer des data depuis l’extérieur de notre fonction resolver.
Imaginons que l'un de nos utilisateur est connecté depuis un autre service que celui de votre application et que vous recèperiez cette data d'autre part. Vous pouvez injectez cette data dans le **context**. ou elle sera récupérer. Nous allons supprimer la ligne ``let me =... `` et l'introduire dans l’initialisation de notre Appolo server.
```
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: {
    me: users[1],
  },
});
```
Ensuite on envoie le context comme troisièmes arguments de notre resolver.
```
const resolvers = {
  Query: {
    users: () => {
      return Object.values(users);
    },
    user: (parent, { id }) => {
      return users[id];
    },
    me: (parent, args, { me }) => {
      return me;
    },
  },
}
```
Le context est le même pour chaque chaque resolvers.
Chaque resolvers peut accéder au context en l'utilisant comme troisièmes arguments.

##### L'argument infos
Ce dernier n'est pas très utilisé car il donne que des informations interne a graphql.
Il est surtout utilisé pour du debbuging ou du tracking, nous verrons ça plus loin.

## 4 Les relations entre les types
##### Un second type : Message
Dans cette section nous allons rajouter un grapqhql type *Message* et le faire interagir avec notre User type.
Dans notre application les user peuvent poster des messages. On va rajouter deux query et un type message.
```
const schema = gql`
  type Query {
    users: [User!]
    user(id: ID!): User
    me: User
    messages: [Message!]!
    message(id: ID!): Message!
  }
  type User {
    id: ID!
    username: String!
  }
  type Message {
    id: ID!
    text: String!
  }
`;
```
On rajoute ensuite une variable(sample de données) contenant nos messages ainsi que comme toujours nos resolvers correspondant.
 ```
 let messages = {
  1: {
    id: '1',
    text: 'J'aime les frites',
  },
  2: {
    id: '2',
    text: 'J'aime les canards',
  },
};
 ```
 ```
 messages: () => {
      return Object.values(messages);
    },
    message: (parent, { id }) => {
      return messages[id];
    },
 ```
 Dans le playground on peut voir que les données sont bien la.On va ensuite creer une relation entre
 nos deux types.
 ```
 type Message {
     id: ID!
     text: String!
     user: User!
   }
 ```
Comme nos message n'ont pas d'entité user dans notre model nous allons devoir creer un resolver pour celui ci.
```
Message: {
    user: (parent, args, { me }) => {
      return me;
    },
  },
```
Pour tester cela nous allons entré une query pour vérifier que tous est bien juste
```
{
  message(id: "1") {
    id
    text
    user {
      id
      username
    }
  }
}
```
Nous avons bien les bon résultats dans le playground, nous pouvons maintenant adapter notre application pour une utilisation plus réaliste.
Nos samples de données ont besoins de clé pour se referencer entre elle.Donc on va attribuer une propriété userId a message.
```
let messages = {
  1: {
    id: '1',
    text: 'J'aime les frites',
    userId: '1',
  },
  2: {
    id: '2',
    text: 'J'aime les canards',
    userId: '2',
  },
};
```
Passons au resolver, on peut utiliser notre argument parent pour récupérer notre userId afin que chaque message aie son propre user.
```
const resolvers = {
  ...
  Message: {
    user: message => {
      return users[message.userId];
    },
  },
};
```
Nous allons maintenant creer les relations mais dans l'autre sens ( de users a message)
```
let users = {
  1: {
    id: '1',
    username: 'Martin Malin',
    messageIds: [1],
  },
  2: {
    id: '2',
    username: 'Pépé LePutois',
    messageIds: [2],
  },
};
```
Modifions notre schema aussi
```
type User {
    id: ID!
    username: String!
    messages: [Message!]
  }

```
Comme notre entité user n'as pas de message mais des identifiants message, on peut écrire dans le resolver User. Ici on renvoie tous les messages d'un user.
```
User: {
    messages: user => {
      return Object.values(messages).filter(
        message => message.userId === user.id,
      );
    },
  },
```
## 5 Les Query et les mutations
Jusqu'ici nous avons definis nos query avec notre schema graphql en utilisant deux type lié entre elles.
Cela foncionne tres bien car nous avons setup nos resolvers. Nous allons maintenant voir ensemble les mutations dans graphql.
##### Create message
On va commencer par créer notre premier mutation createMessage.
```
const schema = gql`
  type Query {
    users: [User!]
    user(id: ID!): User
    me: User
    messages: [Message!]!
    message(id: ID!): Message!
  }
  type Mutation {
    createMessage(text: String!): Message!
  }
  ...
`;
```
Nous avons ici un type mutation qui va nous permettre de stocker toutes nos opérations pour inscrire de la données plutôt que de la lire.
Dans notre cas la mutation **createMessage** accepte un text non nul comme argument et renvoie le message créé.
Comme a chaque fois on crée un resolver correspondant.
```
Mutation: {
    createMessage: (parent, { text }, { me }) => {
      const message = {
        text,
        userId: me.id,
      };
      return message;
    },
  },
```
Le resolver de la mutation as accès au texte grâce au second arguments et a accès a notre user me grâce au troisième qui représente le contexte.
L'argument parent ici n'est pas utilisé mais il faut l'indiquer.
Il nous manque juste une chose, l'attribution d'un Id unique pour chacun de nos nouveaux messages.
Pour cela nous allons installer une libraires qui va nous y aider.
```
npm install uuid --save
```
On l'importe ensuite dans notre fichier index.js
```
import uuidv4 from 'uuid/v4';
```
On peut maintenant attribuer a chaque message un id unique
```
const resolvers = {
  Query: {
    ...
  },
  Mutation: {
    createMessage: (parent, { text }, { me }) => {
      const id = uuidv4();
      const message = {
        id,
        text,
        userId: me.id,
      };
      return message;
    },
  },
  ...
}
```
Jusque la notre mutation a creéé un objet message et le renvoie dans notre Api.
La plupart du temps vous allez les utilisez pour manipuler votre base de donées mais ici nous allons seulement modifier nos deux variable messages et users.
Nous allons devoir mettre a jour la liste des message disponibles et la liste des messageId doit possédez de nouveaux Id.
```
Mutation: {
    createMessage: (parent, { text }, { me }) => {
      const id = uuidv4();
      const message = {
        id,
        text,
        userId: me.id,
      };
      messages[id] = message;
      users[me.id].messageIds.push(id);
      return message;
    },
  },
```
On peut maintenant tester notre mutation dans le playground
```
mutation {
  createMessage (text: "Hello GraphQL!") {
    id
    text
  }
}
```
##### Delete message
On va maintenant créer une mutation pour supprimer un message.
```
type Mutation {
    createMessage(text: String!): Message!
    deleteMessage(id: ID!): Boolean!
  }
```
La mutation nous renvoie ici un Boolean pour voir si la suppression est un succès ou un échec.Il prend comme input
un identifiant de message.
On passe au resolver
```
deleteMessage: (parent, { id }) => {
      const { [id]: message, ...otherMessages } = messages;
      if (!message) {
        return false;
      }
      messages = otherMessages;
      return true;
    },
```
Ici si il n'y as pas de message on nous retourne false, si il y en a un on crée un objet message sans celui sectionner et on remplace l'ancien objet message par le nouveau.
## 6 Le Stitching
Le stiching dans notre schéma graphql est une features très pratique.
Elle permet de fusionner plusieurs scheama en un seul. Pour l'instant nous n'avons qu'un seul schemas mais nous pourrions avoir un schema propre a message et a user.

Nous allons commencer par une séparation technique et puis nous passerons sur une séparation par domaine.

##### Separation Technique
Pour commencer nous allons créer dans notre dossier *src* trois sous dossiers respectivement nommé models, schema et resolvers. Pour chaque sous dossier nous allons créer un fichier index.js.

On va ensuite importé l'ensemble de nos fichiers dans notre index.js principal.
Voici ce qui doit se trouver dans le fichier '*src/index.js*'
```
import cors from 'cors';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import schema from './schema';
import resolvers from './resolvers';
import models from './models';
const app = express();
app.use(cors());
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: {
    models,
    me: models.users[1],
  },
});
server.applyMiddleware({ app, path: '/graphql' });
app.listen({ port: 8001 }, () => {
  console.log('Apollo Server on http://localhost:8001/graphql');
});
```
Nous avons ici ajouter les models dans notre context. Nos modele sont nos acces au données ici se sont des variable mais elle pourrait bien être d'une db ou d'une autre Api.

Nous pouvons ensuite passé nos échantillons de données dans le fichier *src/models/index.js*
```
let users = {
  1: {
    id: '1',
    username: 'Martin Malin',
    messageIds: [1],
  },
  2: {
    id: '2',
    username: 'Pépé LePutois',
    messageIds: [2],
  },
};
let messages = {
  1: {
    id: '1',
    text: 'J'aime les frites',
    userId: '1',
  },
  2: {
    id: '2',
    text: 'J'aime les canars',
    userId: '2',
  },
};
export default {
  users,
  messages,
};
```
Comme nous avons placé nos modeles dans notre context il seront disponibles pour chaque resolvers.
En parlant du loup on peut faire comme pour precedement et aller placer nos resolvers dans le fichier *src/resolvers/index.js*. Nous devons cependant ajouter notre model a nos fonction pour qu'il fonctionne.
```
import uuidv4 from 'uuid/v4';
export default {
  Query: {
    users: (parent, args, { models }) => {
      return Object.values(models.users);
    },
    user: (parent, { id }, { models }) => {
      return models.users[id];
    },
    me: (parent, args, { me }) => {
      return me;
    },
    messages: (parent, args, { models }) => {
      return Object.values(models.messages);
    },
    message: (parent, { id }, { models }) => {
      return models.messages[id];
    },
  },
  Mutation: {
    createMessage: (parent, { text }, { me, models }) => {
      const id = uuidv4();
      const message = {
        id,
        text,
        userId: me.id,
      };
      models.messages[id] = message;
      models.users[me.id].messageIds.push(id);
      return message;
    },
    deleteMessage: (parent, { id }, { models }) => {
      const { [id]: message, ...otherMessages } = models.messages;
      if (!message) {
        return false;
      }
      models.messages = otherMessages;
      return true;
    },
  },
  User: {
    messages: (user, args, { models }) => {
      return Object.values(models.messages).filter(
        message => message.userId === user.id,
      );
    },
  },
  Message: {
    user: (message, args, { models }) => {
      return models.users[message.userId];
    },
  },
};
```
Les resolvers reçoivent les infos du model via le context(troisième arguments) plutôt que de le recevoir directement de notre échantillons de donnée.

Enfin nous pouvons placer nos schémas dans le fichier *src/schema/index.js*
```
import { gql } from 'apollo-server-express';
export default gql`
  type Query {
    users: [User!]
    user(id: ID!): User
    me: User
    messages: [Message!]!
    message(id: ID!): Message!
  }
  type Mutation {
    createMessage(text: String!): Message!
    deleteMessage(id: ID!): Boolean!
  }
  type User {
    id: ID!
    username: String!
    messages: [Message!]
  }
  type Message {
    id: ID!
    text: String!
    user: User!
  }
`;
```
Notre séparation technique est terminée mais nous n'en avons pas finis, en effet nous avons toujours un seul schémas pour toutes nôtres application.

##### Separation par Domaine

Nous allons pour les sous dossiers schema et resolvers crée deux fichiers nommé *user.js* et *message.js*

Nous allons ensuite comme précédemment fractionner nos fichier dans plusieurs fichiers.Commencons par notre schema.

Dans le fichier *src/schema/user.js*
```
import { gql } from 'apollo-server-express';
export default gql`
  extend type Query {
    users: [User!]
    user(id: ID!): User
    me: User
  }
  type User {
    id: ID!
    username: String!
    messages: [Message!]
  }
`;
```
Meme chose pour *src/schema/message.js*
```
import { gql } from 'apollo-server-express';
export default gql`
  extend type Query {
    messages: [Message!]!
    message(id: ID!): Message!
  }
  extend type Mutation {
    createMessage(text: String!): Message!
    deleteMessage(id: ID!): Boolean!
  }
  type Message {
    id: ID!
    text: String!
    user: User!
  }
`;
```
Chaque fichier décris maintenant son entité plutôt que tout les avoir dans un seul fichier.
Nous avons rajouté un extend a nos query et nos mutation maintenant que nous avons plusieurs schémas grapql nous devons rajouter l'extend.
Maintenant il ne nous reste plus qu'a définir le schéma qui regroupe nos deux schémas dans notre fichier *src/schema/index.js:*
```
import { gql } from 'apollo-server-express';
import userSchema from './user';
import messageSchema from './message';
const linkSchema = gql`
  type Query {
    _: Boolean
  }
  type Mutation {
    _: Boolean
  }
`;
export default [linkSchema, userSchema, messageSchema];
```
Dans se fichier nos deux schémas sont fusionner avec linkSchema qui définis tous les type partagé par tous les schémas.
Le champ underscore vide avec le champ Boolean est une obligation.

On va faire la meme chose avec nos resolvers, on commence par le fichier *src/resolvers/user.js*.
```
export default {
  Query: {
    users: (parent, args, { models }) => {
      return Object.values(models.users);
    },
    user: (parent, { id }, { models }) => {
      return models.users[id];
    },
    me: (parent, args, { me }) => {
      return me;
    },
  },
  User: {
    messages: (user, args, { models }) => {
      return Object.values(models.messages).filter(
        message => message.userId === user.id,
      );
    },
  },
};
```
On passe ensuite au fichier *src/resolvers/message.js*
```
import uuidv4 from 'uuid/v4';
export default {
  Query: {
    messages: (parent, args, { models }) => {
      return Object.values(models.messages);
    },
    message: (parent, { id }, { models }) => {
      return models.messages[id];
    },
  },
  Mutation: {
    createMessage: (parent, { text }, { me, models }) => {
      const id = uuidv4();
      const message = {
        id,
        text,
        userId: me.id,
      };
      models.messages[id] = message;
      models.users[me.id].messageIds.push(id);
      return message;
    },
    deleteMessage: (parent, { id }, { models }) => {
      const { [id]: message, ...otherMessages } = models.messages;
      if (!message) {
        return false;
      }
      models.messages = otherMessages;
      return true;
    },
  },
  Message: {
    user: (message, args, { models }) => {
      return models.users[message.userId];
    },
  },
};
```
Il ne nous reste plus que le fichier *src/resolvers/index.js* dans lequel on importe nos resolver et on les exportent.
```
import userResolvers from './user';
import messageResolvers from './message';
export default [userResolvers, messageResolvers];
```

Vous avez maintenant un point de départ pour votre application graphql avec node.js.

## 7 Postgresql & Sequelize

Nous avons une application fonctionnelle mais toujours pas de base de données. Nous y voila!

Dans cette section nous allons setup notre db postgresql avec comme **ORM**(Object-relational mapping) Sequelize.
Un **ORM** permet au développeurs de manipuler la db avec du Javascript plutôt qu'avec un Query langage.

On va commencer par installer Postgresql sur notre machine.
```
sudo apt-get install postgresql
```
On cree ensuite nos user, db et mdp pour notre db.
```
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE postgres;"
```
On lance ensuite une commande pour lancer notre serveur au démarrage.
```
update-rc.d postgresql enable
```

On peut ensuite lancer notre serveur.(On utilise stop pour stopper notre db)
```
service postgresql start
```

Pour verifier que tous fonctionnne on lance la commande
```
sudo service --status-all
```

Installons ensuite Sequelize(qui est le client pour postgres pour node.js).
```
npm install pg sequelize --save
```

Nous allons créer dans notre dossier models deux fichiers : user.js et message.js.
Comme dis lors de la dernière section nous allons placer notre base de donnée dans le modèle et ne plus utilisé nos deux variables.

Commençons par notre fichier *src/models/user.js*
```
const user = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    username: {
      type: DataTypes.STRING,
      unique: true,
    },
  });
  return User;
};
export default user;
```
On a donc ici une type string unique car nous ne voulons pas avoir deux fois le même username.
Nous allons ensuite lié notre user a nos message et rajouter une option pour que lors de la suppression d'un User tous les messages associé sois eux aussi effacé.
```
const user = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    username: {
      type: DataTypes.STRING,
    },
  });
  User.associate = models => {
    User.hasMany(models.Message, { onDelete: 'CASCADE' });
  };
  return User;
};
export default user;
```

On va faire de meme pour le fichier *src/models/message.js*
```
const message = (sequelize, DataTypes) => {
  const Message = sequelize.define('message', {
    text: {
      type: DataTypes.STRING,
    },
  });
  Message.associate = models => {
    Message.belongsTo(models.User);
  };
  return Message;
};
export default message;
```

On s'occupe ensuite du fichier *src/models/index.js*
```
import Sequelize from 'sequelize';
const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    dialect: 'postgres',
  },
);
export { sequelize };
```
On utilise ici notre fichier *'.env'* pour stocké nos information sur notre db.
On va ici associté nos model les un les autres pou faciliter leurs export.
```
import Sequelize from 'sequelize';
const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    dialect: 'postgres',
  },
);
const models = {
  User: sequelize.import('./user'),
  Message: sequelize.import('./message'),
};
Object.keys(models).forEach(key => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});
export { sequelize };
export default models;
```
Il nous reste a ajouter les dites informations dans notre  *'.env'*
```
DATABASE=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```
On ajoute ensuite nos import a notre fichier *'src/index.js'*
```
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import schema from './schema';
import resolvers from './resolvers';
import models, { sequelize } from './models';
...
sequelize.sync().then(async () => {
  app.listen({ port: 8001 }, () => {
    console.log('Apollo Server on http://localhost:8001/graphql');
  });
});
```
Nous avons terminé le setup de notre base de données mais nous devons encore changer nos resolvers pour que notre application soit fonctionnelle.

## 8 Connecter nos resolvers et notre Db
Pour commencer nous allons aller dans notre fichier *src/resolvers/user.js* et changer les lignes suivantes pour pouvoir utiliser Sequelize.
```
export default {
  Query: {
    users: async (parent, args, { models }) => {
      return await models.User.findAll();
    },
    user: async (parent, { id }, { models }) => {
      return await models.User.findByPk(id);
    },
    me: async (parent, args, { models, me }) => {
      return await models.User.findByPk(me.id);
    },
  },
  User: {
    messages: async (user, args, { models }) => {
      return await models.Message.findAll({
        where: {
          userId: user.id,
        },
      });
    },
  },
};
```
On utilise ici les fonction findall() et findByPk() pour trouver tous les messages specifique a un user.
Avec le where on groupe les messages par userId.
Fesons de meme avec notre fichier *src/reslvers/message.js*.
```
export default {
  Query: {
    messages: async (parent, args, { models }) => {
      return await models.Message.findAll();
    },
    message: async (parent, { id }, { models }) => {
      return await models.Message.findByPk(id);
    },
  },
  Mutation: {
    createMessage: async (parent, { text }, { me, models }) => {
      return await models.Message.create({
        text,
        userId: me.id,
      });
    },
    deleteMessage: async (parent, { id }, { models }) => {
      return await models.Message.destroy({ where: { id } });
    },
  },
  Message: {
    user: async (message, args, { models }) => {
      return await models.User.findByPk(message.userId);
    },
  },
};
```
On remarque un changement crucial ici , l'utilisation d'async/await.
En effet sequilize est un un ORM vasé sur les promise et nous renvoie une promesse Javascript.

Nous allons maintenant ajouter ajouter manuellement deux users avec leurs messages.
```
const eraseDatabaseOnSync = true;
sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
  if (eraseDatabaseOnSync) {
    createUsersWithMessages();
  }
  app.listen({ port: 8001 }, () => {
    console.log('Apollo Server on http://localhost:8001/graphql');
  });
});
const createUsersWithMessages = async () => {
  await models.User.create(
    {
      username: 'Martin Malin',
      messages: [
        {
          text: 'J'aime les frites',
        },
      ],
    },
    {
      include: [models.Message],
    },
  );
  await models.User.create(
    {
      username: 'Pépé LePutois',
      messages: [
        {
          text: 'J'aime les frites',
        },
        {
          text: 'J'aime le canard',
        },
      ],
    },
    {
      include: [models.Message],
    },
  );
};
```
Nous devons ensuite nous occupé de notre user **me**, il ne nous est plus utile car nos user viennent de la db.
On va donc changer notre fichier '*src/models/user.js*' en lui ajoutant une methode.
 ```
 const user = (sequelize, DataTypes) => {
   const User = sequelize.define('user', {
     username: {
       type: DataTypes.STRING,
     },
   });
   User.associate = models => {
     User.hasMany(models.Message, { onDelete: 'CASCADE' });
   };
   User.findByLogin = async login => {
     let user = await User.findOne({
       where: { username: login },
     });
     return user;
   };
   return User;
 };
 export default user;
 ```

Nous allons ensuite modifier notre context dans le fichier '*src/index.js*', on remplace notre me par le premier user de notre db '*Marin Malin*'.
```
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: async () => ({
    models,
    me: await models.User.findByLogin('rwieruch'),
  }),
});
```
Notre application est maintenant fonctionnelle.
Nous allons verifier dans notre db si tous fonctionne.
Dans le terminal:
```
psql postgres
```
```
SELECT * from users;
SELECT text from messages;
```
Nous avons bien les bonnes datas. Notre setup de base est terminé.

## 9 Sources

- The road to grapql de Robin Wieruch.
- Pluralsight : Tuto express, sequilize, GraphQL.
