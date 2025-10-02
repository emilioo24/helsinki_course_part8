import { useMutation } from "@apollo/client/react"
import { useEffect, useState } from "react"
import { LOGIN } from "../bin/queries"

// eslint-disable-next-line react/prop-types
const LoginForm = ({ setToken, setPage, show }) => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [login, result] = useMutation(LOGIN)

    useEffect(() => {
        if (result.data) {
            const token = result.data.login.value
            setToken(token)
            localStorage.setItem("library-user-token", token)
            setPage("authors")
        }
    }, [result.data]) //eslint-disable-line

    if (!show) {
        return null
    }

    const submit = (event) => {
        event.preventDefault()

        login({ variables: { username, password } })
        
        setUsername("")
        setPassword("")
    }

    return (
        <div>
            <form onSubmit={submit}>
                <div>
                    username
                    <input
                        value={username}
                        onChange={({target}) => setUsername(target.value)}
                    />
                </div>
                <div>
                    password
                    <input
                        value={password}
                        type="password"
                        onChange={({target}) => setPassword(target.value)}
                    />
                </div>
                <button type="submit">login</button>
            </form>
        </div>
    )
}

export default LoginForm