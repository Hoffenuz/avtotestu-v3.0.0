import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SignItem {
  src: string;
  title: string;
}

interface SignGroup {
  title: string;
  items: SignItem[];
}

export default function Belgilar() {
  const [groups, setGroups] = useState<SignGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; src: string; title: string }>({
    open: false,
    src: "",
    title: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFromHtml() {
      try {
        const res = await fetch("/belgilar/belgilar.html");
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const sequence = Array.from(doc.querySelectorAll(".categories-header, .dez-box"));
        const results: SignGroup[] = [];
        let current: SignGroup | null = null;
        const seen = new Set<string>();

        sequence.forEach((node) => {
          if (node.classList.contains("categories-header")) {
            const title = (node.textContent || "").replace(/\s+/g, " ").trim();
            current = { title, items: [] };
            results.push(current);
          } else if (node.classList.contains("dez-box")) {
            const img = node.querySelector("img");
            const nameEl = node.querySelector("#prodname");
            if (!img) return;
            const src = img.getAttribute("src") || "";
            const file = src.split("/").pop();
            if (!file) return;
            if (seen.has(file)) return;
            seen.add(file);
            const mapped = "/belgilar/" + file;
            const title =
              (nameEl && nameEl.textContent?.trim()) ||
              img.getAttribute("title") ||
              img.getAttribute("alt") ||
              file;
            if (!current) {
              current = { title: "Barcha belgilar", items: [] };
              results.push(current);
            }
            current.items.push({ src: mapped, title });
          }
        });

        if (!cancelled) setGroups(results);
      } catch (err) {
        console.error("Error loading signs:", err);
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFromHtml();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  const totalSigns = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <MainLayout>
      <SEO 
        title="Yo'l belgilari 2026 - Barcha yangi belgilar"
        description="O'zbekiston yo'l belgilari 2026 yil uchun. Ogohlantiruvchi, taqiqlovchi, buyuruvchi va axborot belgilari. Haydovchilik guvohnomasiga tayyorlanish uchun."
        path="/belgilar"
        keywords="yo'l belgilari, ogohlantiruvchi belgilar, taqiqlovchi belgilar, buyuruvchi belgilar, YHQ belgilari"
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary-hover to-primary py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Yo'l belgilari
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-8 inline-block bg-primary-foreground/10 px-6 py-3 rounded-full backdrop-blur-sm">
            Yangi yo'l belgilari 2025 — {totalSigns} ta belgi
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Belgilarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg rounded-xl bg-primary-foreground border-none shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Signs Grid */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-12">
              {filteredGroups.map((group, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      {group.title}
                    </h2>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {group.items.length} ta
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-4">
                    {group.items.map((item, i) => (
                      <Card
                        key={i}
                        className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                        onClick={() => setModal({ open: true, src: item.src, title: item.title })}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square bg-secondary/50 flex items-center justify-center p-4 group-hover:bg-primary/5 transition-colors">
                            <img
                              src={item.src}
                              alt={item.title}
                              className="max-w-full max-h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3 text-center">
                            <p className="text-xs md:text-sm text-foreground line-clamp-2 font-medium">
                              {item.title}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {filteredGroups.length === 0 && !loading && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    "{searchQuery}" bo'yicha hech narsa topilmadi
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal({ open: false, src: "", title: "" });
          }}
        >
          <div className="bg-card rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="relative bg-secondary/50 p-8 flex items-center justify-center">
              <button
                onClick={() => setModal({ open: false, src: "", title: "" })}
                className="absolute top-4 right-4 w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={modal.src}
                alt={modal.title}
                className="max-h-[50vh] object-contain"
              />
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-semibold text-foreground">{modal.title}</h3>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}