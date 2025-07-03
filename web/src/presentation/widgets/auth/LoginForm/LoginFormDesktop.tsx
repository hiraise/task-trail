import { useState } from "react";

import { sharedTexts } from "@/shared/locales/sharedTexts";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { DesktopWrapper, DesktopCard, Title, Form } from "./LoginForm.styled";
import { Input } from "@/presentation/ui/Input";

export const LoginFormDesktop = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <DesktopWrapper>
      <DesktopCard>
        <Title>Добро пожаловать!</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            type="password"
            placeholder="Пароль"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <SubmitButton type="submit">{sharedTexts.login}</SubmitButton>
        </Form>
      </DesktopCard>
    </DesktopWrapper>
  );
};
