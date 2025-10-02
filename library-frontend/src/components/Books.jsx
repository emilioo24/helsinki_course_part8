import { useApolloClient, useQuery } from "@apollo/client/react"
import { ALL_BOOKS } from "../bin/queries"
import { useState } from "react"

const Books = (props) => {
  const [genre, setGenre] = useState("")
  const result = useQuery(ALL_BOOKS, { variables: { genre } })
  const resultGenre = useQuery(ALL_BOOKS)
  const client = useApolloClient()

  if (result.loading || resultGenre.loading) {
    return <div>loading...</div>
  }
  const books = result.data.allBooks
  const booksGenre = resultGenre.data.allBooks

  const refresh = () => {
    client.refetchQueries({
      include: "active"
    })
  }

  let genres = []

  booksGenre.map((b) => {
    b.genres.map((g) => {
      const verify = genres.filter((v) => v === g)
      if (verify[0] !== g) {
        genres = genres.concat(g)
      }
    })
  })

  // eslint-disable-next-line react/prop-types
  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {
            books.map((b) => (
              <tr key={b.title}>
                <td>{b.title}</td>
                <td>{b.author.name}</td>
                <td>{b.published}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
        {
          genres.map((g) => (
            <button onClick={() => setGenre(g)} key={g}>{g}</button>
          ))
        }
        <button onClick={() => setGenre("")}>all genres</button>
        <button onClick={refresh}>refresh</button>
    </div>
  )
}

export default Books