import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { ContactForm } from "@/components/contact/ContactForm";
import { QuickContactLinks } from "@/components/contact/QuickContactLinks";
import { Card } from "@/components/ui/card";

export default function Contact() {
  return (
    <MainLayout>
     <SEO 
  title="Aloqa - Avtotestu.uz"  // <-- Mana shu qator yetishmayapti edi
  description="Avtotestu.uz bilan bog'laning. Savollar, takliflar yoki yordam uchun Telegram orqali yoki formani to'ldiring."
  path="/contact"
  keywords="aloqa, bog'lanish, yordam, savol javob, avtotestu kontakt"
/>
      
      {/* Sahifa balandligini ekranga moslash va markazlashtirish */}
      <section className="min-h-[calc(100vh-4rem)] bg-background flex flex-col justify-center py-6 md:py-10">
        
        <div className="w-full px-4 md:px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            
            {/* Sarlavha qismi ixchamlashtirildi */}
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground">Aloqa</h1>
              <p className="text-muted-foreground mt-1">
                Bizga xabar qoldiring, tez orada javob beramiz.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Chap taraf: Ma'lumotlar */}
              <div className="order-2 lg:order-1 space-y-6">
                <QuickContactLinks />
                
                <div className="hidden lg:block p-4 bg-muted/50 rounded-xl border text-sm text-muted-foreground">
                  <p>📅 Ish vaqti: Dushanba - Shanba (09:00 - 18:00)</p>
                  <p className="mt-1">⚡️ Operatorlarimiz sizga imkon qadar tez javob berishadi.</p>
                </div>
              </div>

              {/* O'ng taraf: Forma (Card ichida) */}
              <div className="order-1 lg:order-2">
                <Card className="shadow-lg border-muted bg-card">
                  <ContactForm />
                </Card>
              </div>

            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}