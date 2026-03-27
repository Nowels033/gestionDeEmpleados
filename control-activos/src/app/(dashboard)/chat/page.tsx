"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bot, Send, User, Sparkles, Package, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      id: Date.now().toString(),
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
          'El departamento de **Tecnología** tiene **48 activos** por un valor total de **$890,000**.\n\n📊 Desglose:\n- 💻 24 Laptops\n- 🖥️ 12 Monitores\n- 🖨️ 8 Periféricos\n- 🖧 4 Servidores\n\n¿Te gustaría ver el reporte completo en PDF?',
        "¿Qué laptop tiene Juan Pérez?":
          'Juan Pérez García tiene asignada una **Laptop Dell XPS 15**.\n\n📋 Detalles:\n- Código: ACT-0042\n- S/N: DLXPS-2024-0042\n- Marca: Dell\n- Modelo: XPS 15 9530\n- Valor: $35,000\n- Asignada: 10/01/2024\n- 🔒 Resp. Seguridad: Carlos Mendoza\n\n¿Quieres ver el detalle completo o exportar la constancia?',
        "¿Cuánto vale el inventario total?":
          'El valor total del inventario es de **$2,450,000**.\n\n📊 Distribución por categoría:\n- 💻 Equipos TI: $1,200,000 (49%)\n- 🚗 Vehículos: $650,000 (27%)\n- 🪑 Mobiliario: $400,000 (16%)\n- 📀 Software: $200,000 (8%)\n\n📈 Variación este trimestre: +7.9% (+$180,000)',
        "¿Qué activos están sin asignar?":
          'Actualmente hay **12 activos** sin asignar:\n\n📦 Lista:\n1. Monitor Samsung 27" (ACT-0123) - Disponible\n2. Laptop HP Pavilion (ACT-0145) - Disponible\n3. Silla Herman Miller (ACT-0167) - Disponible\n4. Impresora HP LaserJet (ACT-0189) - En mantenimiento\n5. ... y 8 más\n\n¿Quieres asignar alguno o ver la lista completa?',
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
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
      className="h-[calc(100vh-12rem)] flex flex-col"
    >
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          Chat IA
        </h1>
        <p className="text-muted-foreground">
          Pregunta sobre tus activos en lenguaje natural
        </p>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex gap-3 max-w-[80%] ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
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
                <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
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
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
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
        <div className="p-4 border-t">
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
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </motion.div>
  );
}
