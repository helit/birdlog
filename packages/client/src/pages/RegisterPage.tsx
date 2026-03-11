import { FormEvent, useState } from "react";
import { REGISTER_MUTATION } from "../graphql/mutations";
import { useMutation } from "@apollo/client";
import { useAuth } from "../context/AuthContext";

const RegisterPage = ({ onSwitchToLogin }: { onSwitchToLogin: () => void }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerMutation, { loading, error }] = useMutation(REGISTER_MUTATION);

  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await registerMutation({ variables: { name, email, password } });

      if (data?.register) {
        login(data.register.token, data.register.user);
      }
    } catch {
      // error is captured by useMutation's error state
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}></input>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}></input>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
      <button type="submit" disabled={loading}></button>
      {error && <p>{error.message}</p>}
      <button type="button" onClick={onSwitchToLogin}>
        har redan ett konto
      </button>
    </form>
  );
};

export default RegisterPage;
