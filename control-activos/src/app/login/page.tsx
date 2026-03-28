"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BRAND_LOGO_PATH,
  BRAND_NAME,
  BRAND_TAGLINE,
} from "@/lib/brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [logoLoadError, setLogoLoadError] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (response?.error) {
        setError("Credenciales invalidas o usuario inactivo");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Error during login:", err);
      setError("No fue posible iniciar sesion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary)/0.18),transparent_30%),radial-gradient(circle_at_85%_15%,hsl(174_74%_36%/0.14),transparent_30%)]" />
      <div className="flex min-h-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="mb-4"
          >
            {logoLoadError ? (
              <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
                AO
              </div>
            ) : (
              <div className="h-28 w-28 overflow-hidden rounded-2xl border border-border/70 bg-background/90 shadow-lg shadow-primary/30">
                <Image
                  src={BRAND_LOGO_PATH}
                  alt={`Logo ${BRAND_NAME}`}
                  width={112}
                  height={112}
                  unoptimized
                  priority
                  className="h-28 w-28 object-cover"
                  style={{ objectPosition: "50% 35%" }}
                  onError={() => setLogoLoadError(true)}
                />
              </div>
            )}
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight">{BRAND_NAME}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {BRAND_TAGLINE}
          </p>
        </div>

        <Card className="glass-panel border border-border/70 shadow-2xl shadow-primary/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                  />
                  <span className="text-muted-foreground">Recordarme</span>
                </label>
                <a href="#" className="text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 {BRAND_NAME}. Todos los derechos reservados.
        </p>
      </motion.div>
      </div>
    </div>
  );
}
