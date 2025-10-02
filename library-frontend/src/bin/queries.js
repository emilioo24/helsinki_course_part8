import { gql } from "@apollo/client";

export const ALL_AUTHORS = gql`
    query {
        allAuthors {
            name,
            born,
            bookCount,
            id
        }
    }
`

export const ALL_BOOKS = gql`
    query($genre: String) {
        allBooks(genre: $genre) {
            title
            author {
                name
                born
                id
            }
            published
            id
            genres
        }
    }
`

export const ADD_BOOK = gql`
    mutation createBook($title: String!, $published: Int!, $author: String!, $genres: [String!]!) 
    {
        addBook(
            title: $title,
            published: $published,
            author: $author,
            genres: $genres
        ) {
            title,
            published,
            author {
                name
            },
            genres
        }
    }
`

export const BOOK_ADDED = gql`
    subscription {
        bookAdded {
            title
            published
            author {
                name
                born
                id
            }
            genres
            id
        }
    }
`

export const EDIT_BORN = gql`
    mutation editAuthor($name: String!, $born: Int!) {
        editAuthor(name: $name, setBornTo: $born) {
            name,
            born,
            id,
        }
    }
`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`

export const ME = gql`
    query {
        me {
            username,
            favoriteGenre,
            id
        }
    }
`