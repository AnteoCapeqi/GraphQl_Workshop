# GraphQl_Workshop
## Prérequis
- Installer NodeJs
- Installer Nodeamon
- Installer Babel ( Plus les Presets)

###### Tous cela se trouve dans le repo de base a télécharger.

## 1-Setup de base d'Appolo Server avec Express
On va ici utiliser Appolo Server avec Express. Il existe de nombreuses
libraires que l'on peut employé mais mon choix c'est porté sur ceux la car c'est
sur eux que j'ai trouvé le plus de documentation et de tuto.

- #### Appolo Server

``npm install apollo-server apollo-server-express --save``

- #### Express

``npm install express graphql --save ``

- #### Premiers pas

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

- #### Cors

Cette partie est ***optionnelle***, mais j’apprécie beaucoup cors. Cors est un acronyme
pour **Cross-Origin Resource Sharing** ce qui ici va nous permettre d’émuler des requêtes Http depuis d'autre domaine que le notre.

On ajoute donc notre import dans index.js
```
import cors from 'cors';
```
Et on ajoute cors a notre middleware express.
```
app.use(cors());
```

## 2-Types definition

- #### Le point d'exclamation

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
        username: 'Robin Wieruch',
      };
    },
    user: () => {
      return {
        username: 'Dave Davids',
      };
    },
  },
};
```
Ensuite nous allons profiter de l'argument id qui arrive de notre query pour décider quel User renvoyé. tous les arguments sont dans le second argument de notre fonction.
```
user: (parent, args) => {
      return {
        username: 'Dave Davids',
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
    username: 'Robin Wieruch',
  },
  2: {
    id: '2',
    username: 'Dave Davids',
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

- #### Une liste d'users

Nous allons maintenant creer une troisieme query qui va nous permettre d'afficher une liste de l'ensemble de nos users.
```
const schema = gql`
  type Query {
    users: [User!]
    user(id: ID!): User
    me: User
  }
```
Ici notre query va nous donc nous renvoyez une liste d'users (grace au brackets carré).
Dans cette liste aucun user ne peut etre null mais la liste peut revenir nul.(Sinon nous aurions pu indiquer **[User!]!**).
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
Toutes nos query sont regroupé dans sous une seule query type qui liste toutes les query de notre Grapqh Api. 
