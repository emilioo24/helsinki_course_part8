import { useQuery } from "@apollo/client/react"
import { ALL_AUTHORS } from "../bin/queries"
import Birthyear from "./Birthyear"

const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS)
  if (result.loading) {
    return <div>loading...</div>
  }
  const authors = result.data.allAuthors

  // eslint-disable-next-line react/prop-types
  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Birthyear authors={authors} />
    </div>
  )
}

export default Authors
