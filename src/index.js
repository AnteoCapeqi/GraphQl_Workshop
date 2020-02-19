//Liste d'import
import cors from 'cors';
import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';

const app = express();
app.use(cors());

const schema = gql`
  type Query {
    me: User
  }
  type User {
    username: String!
  }
`;
const resolvers = {
  Query: {
    me: () => {
      return {
        username: 'Anteo Capeqi',
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
});


server.applyMiddleware({ app, path: '/graphql' });
app.listen({ port: 8001 }, () => {
  console.log('Apollo Server on http://localhost:8001/graphql');
});










