import { FormEvent, useState } from "react";
import { REGISTER_MUTATION } from "../graphql/mutations.js";
import { useMutation } from "@apollo/client";
import { useAuth } from "../context/AuthContext.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Label } from "@/components/ui/label.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.js";
import { BirdIcon } from "lucide-react";
import { Link } from "react-router-dom";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerMutation, { loading, error }] = useMutation(REGISTER_MUTATION);

  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await registerMutation({
        variables: { name, email, password },
      });

      if (data?.register) {
        login(data.register.token, data.register.user);
      }
    } catch {
      // error is captured by useMutation's error state
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        <BirdIcon className="size-8 text-primary" />
        <span className="text-2xl font-bold">BirdLog</span>
      </div>
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Ny användare</CardTitle>
        <CardDescription>Skapa ett konto för att börja logga fåglar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Namn</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ditt namn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            {loading ? "Registrerar..." : "Registrera"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Har du redan ett konto? <Link to="/login" className="text-primary hover:underline">Logga in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
    </div>
  );
};

export default RegisterPage;
