# GraphQl_Workshop
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

## 3 - Les relations entre les types
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
On rajoute ensuite une variable contenant nos messages ainsi que comme toujours nos resolvers correspondant.
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
Pour tester cela nous allons entré une query pour verifier que tous est bien juste
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
