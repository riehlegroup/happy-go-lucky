import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Form from "@radix-ui/react-form";
import * as Tabs from "@radix-ui/react-tabs";
import Input from "@/components/common/Input";
import EmailWidget from "@/components/common/EmailWidget.tsx";
import PasswordWidget from "@/components/common/PasswordWidget";
import authApi from "@/services/api/auth";
import AuthStorage from "@/services/storage/auth";
import { en as messages } from "@/messages";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [action, setAction] = useState<"Registration" | "Login">("Login");
  const [validationOn, setValidationOn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  // Updates email based on the value from EmailWidget
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  const handleSubmit = async () => {
    if (!validationOn) {
      setValidationOn(true);
    }

    if (!email || !password || (action === "Registration" && !name)) {
      return;
    }

    try {
      const authStorage = AuthStorage.getInstance();

      if (action === "Registration") {
        const data = await authApi.register(email, password, name);
        setMessage(
          data.message || messages.auth.loginScreen.status.registrationFallback,
        );
      } else {
        const data = await authApi.login(email, password);
        console.log("Response data:", data);

        authStorage.setToken(data.token);
        authStorage.setUser({
          email: data.email,
          name: data.name,
          githubUsername: data.githubUsername,
        });

        setMessage(messages.auth.loginScreen.status.loginSuccess);
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(messages.errors.unexpected);
      }
    }
  };

  return (
    <div className="flex min-h-screen justify-center p-8 pt-20">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-4xl font-bold text-slate-900">
          {messages.app.name}
        </h1>

        <Tabs.Root
          value={action}
          onValueChange={(value) => {
            setAction(value as "Registration" | "Login");
            setValidationOn(false);
          }}
          className="w-full"
        >
          <Tabs.List className="mb-6 flex gap-2">
            <Tabs.Trigger
              value="Login"
              className="flex-1 rounded-md bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              {messages.auth.loginScreen.tabs.login}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="Registration"
              className="flex-1 rounded-md bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              {messages.auth.loginScreen.tabs.registration}
            </Tabs.Trigger>
          </Tabs.List>

          <div className="rounded-xl bg-white p-8 shadow-xl">
            <Form.Root
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <Tabs.Content value="Registration" className="space-y-6">
                <Form.Field name="name">
                  <Input
                    type="text"
                    label={messages.auth.loginScreen.fields.name.label}
                    placeholder={
                      messages.auth.loginScreen.fields.name.placeholder
                    }
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={
                      validationOn && !name
                        ? messages.auth.loginScreen.fields.name.required
                        : undefined
                    }
                  />
                </Form.Field>

                <Form.Field name="email">
                  <Form.Label className="mb-2 block text-sm font-medium text-slate-700">
                    {messages.auth.loginScreen.fields.email.label}
                  </Form.Label>
                  <EmailWidget
                    onEmailChange={handleEmailChange}
                    action={action}
                  />
                  {validationOn && !email && (
                    <Form.Message className="mt-2 text-sm text-red-600">
                      {messages.auth.loginScreen.fields.email.invalid}
                    </Form.Message>
                  )}
                </Form.Field>

                <Form.Field name="password">
                  <Form.Label className="mb-2 block text-sm font-medium text-slate-700">
                    {messages.auth.loginScreen.fields.password.label}
                  </Form.Label>
                  <PasswordWidget
                    password={password}
                    onPasswordChange={handlePasswordChange}
                    action={action}
                  />
                </Form.Field>

                <Form.Submit asChild>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {messages.auth.loginScreen.actions.createAccount}
                  </button>
                </Form.Submit>
              </Tabs.Content>

              <Tabs.Content value="Login" className="space-y-6">
                <Form.Field name="email">
                  <Form.Label className="mb-2 block text-sm font-medium text-slate-700">
                    {messages.auth.loginScreen.fields.email.label}
                  </Form.Label>
                  <EmailWidget
                    onEmailChange={handleEmailChange}
                    action={action}
                  />
                  {validationOn && !email && (
                    <Form.Message className="mt-2 text-sm text-red-600">
                      {messages.auth.loginScreen.fields.email.invalid}
                    </Form.Message>
                  )}
                </Form.Field>

                <Form.Field name="password">
                  <Form.Label className="mb-2 block text-sm font-medium text-slate-700">
                    {messages.auth.loginScreen.fields.password.label}
                  </Form.Label>
                  <PasswordWidget
                    password={password}
                    onPasswordChange={handlePasswordChange}
                    action={action}
                  />
                </Form.Field>

                <div className="text-sm text-slate-600">
                  {messages.auth.loginScreen.forgotPassword.prompt}{" "}
                  <a
                    href="/ForgotPassword"
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {messages.auth.loginScreen.forgotPassword.link}
                  </a>
                </div>

                <Form.Submit asChild>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {messages.auth.loginScreen.actions.signIn}
                  </button>
                </Form.Submit>
              </Tabs.Content>
            </Form.Root>

            {message && (
              <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                {message}
              </div>
            )}
          </div>
        </Tabs.Root>
      </div>
    </div>
  );
};

export default LoginScreen;
