import { FormEvent, useState } from "react";
import { LOGIN_MUTATION } from "../graphql/mutations";
import { useMutation } from "@apollo/client";
import { useAuth } from "../context/AuthContext";

const LoginPage = ({ onSwitchToRegister }: { onSwitchToRegister: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION);

  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await loginMutation({ variables: { email, password } });

      if (data?.login) {
        login(data.login.token, data.login.user);
      }
    } catch {
      // error is captured by useMutation's error state
    }
  };

  return (
    <div>
      <h1>Logga in</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}></input>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        ></input>
        <button type="submit" disabled={loading}>
          Logga in
        </button>
        {error && <p>{error.message}</p>}
        <button type="button" onClick={onSwitchToRegister}>
          registrera
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
