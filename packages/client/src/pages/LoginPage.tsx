import { FormEvent, useState } from "react";
import { LOGIN_MUTATION } from "../graphql/mutations.js";
import { useMutation } from "@apollo/client";
import { useAuth } from "../context/AuthContext.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Label } from "@/components/ui/label.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.js";
import { Link } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION);

  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await loginMutation({
        variables: { email, password },
      });

      if (data?.login) {
        login(data.login.token, data.login.user);
      }
    } catch {
      // error is captured by useMutation's error state
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Logga in</CardTitle>
        <CardDescription>Ange din e-post och lösenord för att logga in</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              placeholder="namn@exempel.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Loggar in..." : "Logga in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Har du inget konto? <Link to="/register">Skapa konto</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginPage;
