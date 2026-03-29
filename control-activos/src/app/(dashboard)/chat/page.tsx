"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bot, Send, User, Sparkles, Package, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestions = [
  { icon: Package, text: "¿Cuántos activos tiene Tecnología?" },
  { icon: Users, text: "¿Qué laptop tiene Juan Pérez?" },
  { icon: Building2, text: "¿Cuánto vale el inventario total?" },
  { icon: Package, text: "¿Qué activos están sin asignar?" },
];

export default function ChatPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente de activos. Puedo ayudarte a consultar información sobre activos, usuarios, departamentos y más. ¿En qué te puedo ayudar?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messageIdRef = React.useRef(2);

  const getNextMessageId = () => {
    const nextId = messageIdRef.current;
    messageIdRef.current += 1;
    return String(nextId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: getNextMessageId(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulación de respuesta de IA
    setTimeout(() => {
      const responses: Record<string, string> = {
        "¿Cuántos activos tiene Tecnología?":
          'El departamento de **Tecnología** tiene **48 activos** por un valor total de **890.000 €**.\n\n📊 Desglose:\n- 💻 24 Laptops\n- 🖥️ 12 Monitores\n- 🖨️ 8 Periféricos\n- 🖧 4 Servidores\n\n¿Te gustaría ver el reporte completo en PDF?',
        "¿Qué laptop tiene Juan Pérez?":
          'Juan Pérez García tiene asignada una **Laptop Dell XPS 15**.\n\n📋 Detalles:\n- Código: ACT-0042\n- S/N: DLXPS-2024-0042\n- Marca: Dell\n- Modelo: XPS 15 9530\n- Valor: 35.000 €\n- Asignada: 10/01/2024\n- 🔒 Resp. Seguridad: Carlos Mendoza\n\n¿Quieres ver el detalle completo o exportar la constancia?',
        "¿Cuánto vale el inventario total?":
          'El valor total del inventario es de **2.450.000 €**.\n\n📊 Distribución por categoría:\n- 💻 Equipos TI: 1.200.000 € (49%)\n- 🚗 Vehículos: 650.000 € (27%)\n- 🪑 Mobiliario: 400.000 € (16%)\n- 📀 Software: 200.000 € (8%)\n\n📈 Variación este trimestre: +7.9% (+180.000 €)',
        "¿Qué activos están sin asignar?":
          'Actualmente hay **12 activos** sin asignar:\n\n📦 Lista:\n1. Monitor Samsung 27" (ACT-0123) - Disponible\n2. Laptop HP Pavilion (ACT-0145) - Disponible\n3. Silla Herman Miller (ACT-0167) - Disponible\n4. Impresora HP LaserJet (ACT-0189) - En mantenimiento\n5. ... y 8 más\n\n¿Quieres asignar alguno o ver la lista completa?',
      };

      const assistantMessage: Message = {
        id: getNextMessageId(),
        role: "assistant",
        content:
          responses[messageText] ||
          `Entiendo tu pregunta sobre "${messageText}".\n\nPuedo ayudarte con:\n- 📦 Información de activos\n- 👥 Asignaciones a usuarios\n- 🏢 Activos por departamento\n- 💰 Valuación de inventario\n- 🔒 Estado de verificaciones de seguridad\n\n¿Podrías ser más específico sobre lo que necesitas?`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-[calc(100vh-12rem)] flex-col gap-5"
    >
      <DashboardPageHeader
        eyebrow="Asistente"
        title={
          <span className="flex items-center gap-2">
            <Bot className="h-7 w-7 text-muted-foreground" />
            Chat IA
          </span>
        }
        description="Pregunta sobre tus activos en lenguaje natural"
      />

      {/* Chat Container */}
      <Card className="flex flex-1 flex-col overflow-hidden border-border">
        {/* Messages */}
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#101010_0%,#0d0d0d_100%)] p-5">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[85%] gap-3 md:max-w-[72%] ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    message.role === "user"
                      ? "border-border bg-secondary text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`rounded-2xl border px-4 py-3 ${
                    message.role === "user"
                      ? "rounded-br-md border-border bg-secondary text-foreground"
                      : "rounded-bl-md border-border bg-card text-foreground"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm tracking-[0.01em]">
                    {message.content.split("\n").map((line, i) => {
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return (
                          <strong key={i} className="font-semibold">
                            {line.replace(/\*\*/g, "")}
                          </strong>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <div key={i} className="ml-2">
                            {line}
                          </div>
                        );
                      }
                      return <div key={i}>{line}</div>;
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/45"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/45"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/45"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Pensando...
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="border-t border-border px-5 pb-4 pt-3">
            <p className="mb-2 flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Sugerencias
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => handleSend(suggestion.text)}
                >
                  <suggestion.icon className="h-3 w-3 mr-1" />
                  {suggestion.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Pregunta sobre tus activos..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="h-11 flex-1"
            />
            <Button type="submit" size="icon" className="h-11 w-11" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar mensaje</span>
            </Button>
          </form>
        </div>
      </Card>
    </motion.div>
  );
}
