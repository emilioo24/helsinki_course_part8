import { useEffect, useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import { useApolloClient, useSubscription } from "@apollo/client/react";
import Recommend from "./components/Recommend";
import { BOOK_ADDED } from "./bin/queries";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null)
  const client = useApolloClient()

  useEffect(() => {
    const verifyToken = localStorage.getItem("library-user-token")
    if (verifyToken) {
      setToken(verifyToken)
    }
  }, [])

useSubscription(BOOK_ADDED, {
  onData: ({ data, client }) => {
    window.alert(`ATENTION! A new book has added: ${data.data.bookAdded.title}`)
    client.refetchQueries({
      include: "active"
    })
  },
  onError: (error) => {
    console.error("Subscription error:", error)
  }
})

  const logout = async () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
    setPage("authors")
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {
          token ? (
            <>
              <button onClick={() => setPage("add")}>add book</button>
              <button onClick={() => setPage("recommend")}>recommend</button>
              <button onClick={logout}>logout</button>
            </>
          ) : (
            <button onClick={() => setPage("login")}>login</button>
          )
        }
      </div>

      <Authors show={page === "authors"} />

      <Books show={page === "books"} />

      <NewBook show={page === "add"} />

      <LoginForm show={page === "login"} setToken={setToken} setPage={setPage} />

      {
        token ? <Recommend show={page === "recommend"} /> : null
      }
    </div>
  );
};

export default App;
