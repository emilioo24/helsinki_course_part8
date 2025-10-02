/* eslint-disable react/prop-types */
import { useQuery } from "@apollo/client/react"
import { ALL_BOOKS, ME } from "../bin/queries"

// eslint-disable-next-line react/prop-types
const Recommend = ({ show }) => {
    const me = useQuery(ME)
    const resultBooks = useQuery(ALL_BOOKS, { 
        variables: { genre: me.data?.me?.favoriteGenre },
        skip: !me.data?.me?.favoriteGenre 
    })
    
    if (resultBooks.loading || me.loading) {
        return <div>loading...</div>
    }
    const books = resultBooks.data.allBooks

    if (!show) {
        return null
    }

    return (
        <div>
            <h2>recommendations</h2>

            books in your favorite genre <b>{me.data.me.favoriteGenre}</b>
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
        </div>
    )
}

export default Recommend