import { useEffect } from "react";

/**
 * Test davom etayotganini `<body>` klassi orqali belgilaydi.
 *
 * Pastki navigatsiya shu klassga qarab yashirinadi (index.css).
 * React holati o'rniga body klassi ishlatilgan: test interfeysi har bir
 * javobda qayta renderlanadi va panelni ham qayta hisoblatib yubormasligi
 * kerak.
 *
 * Hisoblagich ishlatiladi, chunki nazariy jihatdan bir vaqtda bir nechta
 * test komponenti mount bo'lishi mumkin (masalan almashish paytida) — biri
 * unmount bo'lganda klass boshqasidan tortib olinmasin.
 */
let activeCount = 0;

export function useTestActive(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    activeCount += 1;
    document.body.classList.add("test-active");
    return () => {
      activeCount = Math.max(0, activeCount - 1);
      if (activeCount === 0) document.body.classList.remove("test-active");
    };
  }, [active]);
}
