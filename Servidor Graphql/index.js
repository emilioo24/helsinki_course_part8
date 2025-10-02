const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@as-integrations/express5')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const express = require('express')
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')
const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/use/ws')
const jwt = require("jsonwebtoken")
require("./db/connection")

const Book = require("./models/books")
const Author = require("./models/authors")
const User = require("./models/users")
const { GraphQLError } = require('graphql')
const { PubSub } = require("graphql-subscriptions")
const pubsub = new PubSub()
const DataLoader = require("dataloader")

const batchBookCounts = async (authorIds) => {
  const books = await Book.aggregate([
    { $match: { author: { $in: authorIds } } },
    { $group: { _id: "$author", count: { $sum: 1 } } }
  ])

  const bookCount = {}
  books.forEach(b => { bookCount[b._id.toString()] = b.count })

  return authorIds.map(id => bookCount[id.toString()] || 0)
}

const createLoaders = () => ({
  bookCountLoader: new DataLoader(batchBookCounts)
})

/*
  you can remove the placeholder query once your first one has been implemented 
*/

const typeDefs = `
  type Book {
    title: String!,
    author: Author!,
    published: Int!,
    genres: [String!]!,
    id: ID!
  }

  type Author {
    name: String!,
    born: Int,
    id: ID!,
    bookCount: Int!
  }

  type User {
    username: String!,
    favoriteGenre: String!,
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    me: User,
    dummy: Int,
    bookCount: Int!,
    authorCount: Int!,
    allBooks(author: String, genre: String): [Book!]!,
    allAuthors: [Author!]!
  }

  type Subscription {
    bookAdded: Book!
  }

  type Mutation {
    addBook(
      title: String!,
      author: String!,
      published: Int!,
      genres: [String!]!,
    ) : Book
    editAuthor(
      name: String!,
      setBornTo: Int!
    ) : Author
    createUser(
      username: String!,
      favoriteGenre: String!
    ) : User
    login(
      username: String!,
      password: String!
    ) : Token
  }
`

const resolvers = {
  Query: {
    me: (root, args, context) => {
      return context.currentUser
    },
    dummy: () => 0,
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (args.author && args.genre) {
          const author = await Author.findOne({ name: args.author })
          return Book.find({ author: author._id, genres: args.genre }).populate("author")
      }
      if (args.author) {
          const author = await Author.findOne({ name: args.author })
          return await Book.find({ author: author._id }).populate("author")
      }
      if (args.genre) { 
          return Book.find({ genres: args.genre }).populate("author")
      }
      return await Book.find({}).populate("author")
    },
    allAuthors: async () => await Author.find({})
  },
  Author: {
    bookCount: async (root, args, context) => {
        return context.loaders.bookCountLoader.load(root._id)
    }
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterableIterator(["BOOK_ADDED"])
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const authorName = await Author.findOne({ name: args.author })
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      }

      if (!authorName) {
        try {
          const author = new Author({ name: args.author })
          const newAuthor = await author.save()
          const newBook = new Book({ ...args, author: newAuthor._id })
          await newBook.save()
        } catch (error) {
          throw new GraphQLError(error.message, {
            extensions: { invalidArgs: args }
          })
        }
      }
      const newBook = new Book({ ...args, author: authorName._id })
      try {
        await newBook.save()
        await newBook.populate("author")
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: { invalidArgs: args }
        })
      }

      pubsub.publish("BOOK_ADDED", { bookAdded: newBook })

      return newBook
    },
    editAuthor: async (root, args, context) => {
        const author = await Author.findOne({ name: args.name })
        const currentUser = context.currentUser

        if (!currentUser) {
          throw new GraphQLError("not authenticated", {
            extensions: {
              code: "BAD_USER_INPUT"
            }
          })
        }

        if (!author) {
            return null
        }
        author.born = args.setBornTo
        try {
          await author.save()
        } catch (error) {
          throw new GraphQLError(error.message, {
            extensions: { invalidArgs: args }
          })
        }
        return author
    },
    createUser: async (root, args) => {
      const user = new User({ username: args.username })

      return user.save()
        .catch(error => {
          throw new GraphQLError("Creating the user failed", {
            extensions: {
              code: "BAD_USER_INPUT",
              invalidArgs: args.name,
              error
            }
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if ( !user || args.password !== "secret" ) {
        throw new GraphQLError("wrong credentials", {
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      }

      const userForToken = {
        username: user.username,
        id: user._id
      }

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    }
  }
}






const schema = makeExecutableSchema({ typeDefs, resolvers })

async function startServer() {
  const app = express()
  const httpServer = http.createServer(app)

  // 🚀 WebSocket server para subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })

  const getUserFromAuth = async (authHeader) => {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        authHeader.substring(7), process.env.JWT_SECRET
      )
      return await User.findById(decodedToken.id)
    }
    return null
  }

  // graphql-ws: conectar resolvers con context
  const serverCleanup = useServer({
    schema,
    context: async (ctx) => {
      const auth = ctx.connectionParams?.authorization
      const currentUser = await getUserFromAuth(auth)
      return { currentUser, loaders: createLoaders() }
    },
  }, wsServer)

  const server = new ApolloServer({
    schema,
  })

  await server.start()

  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req?.headers.authorization
        const currentUser = await getUserFromAuth(auth)
        return { currentUser, loaders: createLoaders() }
      },
    })
  )

  const PORT = 4000
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`)
  })
}

startServer()