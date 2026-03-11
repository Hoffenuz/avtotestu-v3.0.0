import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { ContactForm } from "@/components/contact/ContactForm";
import { QuickContactLinks } from "@/components/contact/QuickContactLinks";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
  return (
    <MainLayout>
      <SEO 
        title={t("contact.seoTitle")}
        description={t("contact.seoDescription")}
        path="/contact"
        keywords="aloqa, bog'lanish, yordam, savol javob, avtotestu kontakt"
      />
      
      <section className="bg-background pt-8 pb-12 md:pt-12">
        <div className="w-full px-4 md:px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            

            {/* items-stretch muhim: ikkala ustun bir xil balandlikka ega bo'lishga harakat qiladi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
              
              {/* Chap taraf: Ma'lumotlar */}
              <div className="order-2 lg:order-1 flex flex-col h-full">
                {/* Konteyner dizayni Formanikiga o'xshash */}
                <div className="flex-1 rounded-xl border border-muted bg-card shadow-lg p-6 md:p-8 flex flex-col">
                   <QuickContactLinks />
                </div>
              </div>

              {/* O'ng taraf: Forma */}
              <div className="order-1 lg:order-2 flex flex-col h-full">
                <div className="flex-1 rounded-xl border border-muted bg-card shadow-lg p-6 md:p-8 flex flex-col">
                  <ContactForm />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}