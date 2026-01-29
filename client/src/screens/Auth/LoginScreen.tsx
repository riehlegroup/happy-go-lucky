import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Form from "@radix-ui/react-form";
import * as Tabs from "@radix-ui/react-tabs";
import Input from "@/components/common/Input";
import EmailWidget from "@/components/common/EmailWidget.tsx";
import PasswordWidget from "@/components/common/PasswordWidget";
import authApi from "@/services/api/auth";
import AuthStorage from "@/services/storage/auth";
import { ModeToggle } from "@/components/common/mode-toggle";

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
        setMessage(data.message || "Registration successful! Please check your email to confirm your account.");
      } else {
        const data = await authApi.login(email, password);
        console.log("Response data:", data);

        authStorage.setToken(data.token);
        authStorage.setUser({
          email: data.email,
          name: data.name,
          githubUsername: data.githubUsername,
        });

        setMessage("Login successful!");
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="flex min-h-screen justify-center p-8 pt-20 bg-background relative">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-4xl font-bold text-foreground">
          Happy Go Lucky
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
              className="flex-1 rounded-md bg-card px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-accent data-[state=active]:bg-card data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Login
            </Tabs.Trigger>
            <Tabs.Trigger
              value="Registration"
              className="flex-1 rounded-md bg-card px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-accent data-[state=active]:bg-card data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Sign Up
            </Tabs.Trigger>
          </Tabs.List>

          <div className="rounded-xl bg-card p-8 shadow-xl border border-border">
            <Form.Root onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <Tabs.Content value="Registration" className="space-y-6">
                <Form.Field name="name">
                  <Input
                    type="text"
                    label="Name"
                    placeholder="Please enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={validationOn && !name ? "Name is required" : undefined}
                  />
                </Form.Field>

                <Form.Field name="email">
                  <Form.Label className="mb-2 block text-sm font-medium text-foreground">
                    Email
                  </Form.Label>
                  <EmailWidget onEmailChange={handleEmailChange} action={action} />
                  {validationOn && !email && (
                    <Form.Message className="mt-2 text-sm text-red-600">
                      Please enter a valid email address
                    </Form.Message>
                  )}
                </Form.Field>

                <Form.Field name="password">
                  <Form.Label className="mb-2 block text-sm font-medium text-foreground">
                    Password
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
                    className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Create Account
                  </button>
                </Form.Submit>
              </Tabs.Content>

              <Tabs.Content value="Login" className="space-y-6">
                <Form.Field name="email">
                  <Form.Label className="mb-2 block text-sm font-medium text-foreground">
                    Email
                  </Form.Label>
                  <EmailWidget onEmailChange={handleEmailChange} action={action} />
                  {validationOn && !email && (
                    <Form.Message className="mt-2 text-sm text-red-600">
                      Please enter a valid email address
                    </Form.Message>
                  )}
                </Form.Field>

                <Form.Field name="password">
                  <Form.Label className="mb-2 block text-sm font-medium text-foreground">
                    Password
                  </Form.Label>
                  <PasswordWidget
                    password={password}
                    onPasswordChange={handlePasswordChange}
                    action={action}
                  />
                </Form.Field>

                <div className="text-sm text-muted-foreground">
                  Forget Password?{" "}
                  <a
                    href="/ForgotPassword"
                    className="font-medium text-primary hover:text-primary/90 hover:underline"
                  >
                    Click here
                  </a>
                </div>

                <Form.Submit asChild>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Sign In
                  </button>
                </Form.Submit>
              </Tabs.Content>
            </Form.Root>

            {message && (
              <div className="mt-4 rounded-md border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
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
