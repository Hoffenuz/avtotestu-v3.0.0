import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, MessageCircle, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ContactMethod = "phone" | "telegram";

export function ContactForm() {
  const [name, setName] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("phone");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  function formatPhone(v: string) {
    setPhone(v.replace(/\D/g, "").substring(0, 9));
  }

  const isValidPhone = (phoneNumber: string): boolean => {
    return /^\d{9}$/.test(phoneNumber);
  };

  const isValidTelegram = (username: string): boolean => {
    return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(username);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Xatolik",
        description: "Iltimos, ismingizni kiriting.",
        variant: "destructive",
      });
      return;
    }

    if (contactMethod === "phone" && !phone) {
      toast({
        title: "Xatolik",
        description: "Iltimos, telefon raqamingizni kiriting.",
        variant: "destructive",
      });
      return;
    }

    if (contactMethod === "telegram" && !telegram) {
      toast({
        title: "Xatolik",
        description: "Iltimos, Telegram username'ingizni kiriting.",
        variant: "destructive",
      });
      return;
    }

    if (contactMethod === "phone" && !isValidPhone(phone)) {
      toast({
        title: "Noto'g'ri telefon raqam",
        description: "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak.",
        variant: "destructive",
      });
      return;
    }

    if (contactMethod === "telegram" && !isValidTelegram(telegram)) {
      toast({
        title: "Noto'g'ri Telegram username",
        description: "Telegram username 5-32 ta belgi bo'lishi kerak.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const contactValue = contactMethod === "phone" 
        ? `+998${phone}` 
        : `@${telegram.replace(/^@/, '')}`;

      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: name.trim(),
          phone: contactValue,
          subject: `Aloqa formasi (${contactMethod === "phone" ? "Telefon" : "Telegram"})`,
          message: message.trim(),
          user_id: user?.id || null
        });

      if (error) throw error;
      
      toast({
        title: "Yuborildi!",
        description: "Xabaringiz muvaffaqiyatli yuborildi.",
      });
      
      setName("");
      setPhone("");
      setTelegram("");
      setMessage("");
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Xatolik",
        description: "Xabarni yuborishda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* 1. Qator: Ism va Bog'lanish turi (Desktopda yonma-yon) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Ism Input */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Ismingiz <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ismingiz"
              className="pl-9 bg-background/50"
              required
            />
          </div>
        </div>

        {/* Bog'lanish Turi (Radio Buttons o'rniga Custom Toggle) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Aloqa turi</Label>
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setContactMethod("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                contactMethod === "phone"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-background/50"
              }`}
            >
              <Phone className="w-4 h-4" /> Telefon
            </button>
            <button
              type="button"
              onClick={() => setContactMethod("telegram")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                contactMethod === "telegram"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-background/50"
              }`}
            >
              <MessageCircle className="w-4 h-4" /> Telegram
            </button>
          </div>
        </div>
      </div>

      {/* 2. Qator: Tanlangan aloqa turi uchun Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {contactMethod === "phone" ? "Telefon raqamingiz" : "Telegram username"} <span className="text-destructive">*</span>
        </Label>
        
        {contactMethod === "phone" ? (
          <div className="flex">
            <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground font-medium">
              +998
            </span>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => formatPhone(e.target.value)}
              placeholder="90 123 45 67"
              maxLength={9}
              className="rounded-l-none bg-background/50"
            />
          </div>
        ) : (
          <div className="flex">
            <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground font-medium">
              @
            </span>
            <Input
              id="telegram"
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="username"
              maxLength={32}
              className="rounded-l-none bg-background/50"
            />
          </div>
        )}
      </div>

      {/* 3. Qator: Xabar Matni */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium">
          Xabaringiz
        </Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Savol yoki taklifingiz..."
          className="min-h-[100px] resize-none bg-background/50"
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full font-semibold" 
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Yuborilmoqda...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Yuborish
          </>
        )}
      </Button>
    </form>
  );
}