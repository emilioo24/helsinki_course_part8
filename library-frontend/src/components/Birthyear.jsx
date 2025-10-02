/* eslint-disable react/prop-types */
import { useMutation } from "@apollo/client/react"
import { useState } from "react"
import { EDIT_BORN } from "../bin/queries"

const Birthyear = ({ authors }) => {
    const [name, setName] = useState(authors[0].name)
    const [born, setBorn] = useState("")
    
    const [ changeBorn ] = useMutation(EDIT_BORN)

    const submit = (event) => {
        event.preventDefault()
        console.log(name)
        changeBorn({ variables: { name, born }})

        setName(authors[0].name)
        setBorn("")
    }

    return (
        <div>
            <h2>Set birthyear</h2>
            <form onSubmit={submit}>
                {/*<div>
                    name
                    <input
                        value={name}
                        onChange={({target}) => setName(target.value)}
                    />
                </div>*/}
                <select onChange={({target}) => setName(target.value)}>
                    {
                        authors.map(a => (
                            <option key={a.name} value={a.name}>{a.name}</option>
                        ))
                    }
                </select>
                <div>
                    born
                    <input 
                        type="number"
                        value={born}
                        onChange={({target}) => setBorn(parseInt(target.value))}
                    />
                </div>
                <button type="submit">update author</button>
            </form>
        </div>
    )
}

export default Birthyear