import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";


/* =======================
   Tipos
======================= */


type ComponentItem = {
  id: number;
  name: string;
  price: number;
};

type SelectedItem = ComponentItem & {
  quantity: number;
};

type Section = {
  title: string;
  items: ComponentItem[];
};

/* =======================
   App
======================= */

export default function App() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [comprador, setComprador] = useState("");


  /* =======================
     Excel con secciones
  ======================= */

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
    });

    let currentSection = "General";
    let id = 0;
    const parsedSections: Section[] = [];

    const getSection = (title: string) => {
      let section = parsedSections.find(s => s.title === title);
      if (!section) {
        section = { title, items: [] };
        parsedSections.push(section);
      }
      return section;
    };

    for (const row of rows) {
      // Cabecera de sección
      if (
        row &&
        row.length === 1 &&
        typeof row[0] === "string"
      ) {
        currentSection = row[0].toUpperCase();
        continue;
      }

      // Item válido (nombre + precio)
      if (
        typeof row?.[0] === "string" &&
        typeof row?.[1] === "number"
      ) {
        getSection(currentSection).items.push({
          id: id++,
          name: row[0],
          price: row[1],
        });
      }
    }

    setSections(parsedSections);
    setSelected([]);
  };

  /* =======================
     Selección
  ======================= */

  const addItem = (component: ComponentItem) => {
    setSelected(prev => {
      const existing = prev.find(i => i.id === component.id);
      if (existing) {
        return prev.map(i =>
          i.id === component.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...component, quantity: 1 }];
    });
  };

  /* Generar pdf.*/
  const generatePDF = () => {
    const doc = new jsPDF();

    let y = 25;

    // Fondo pastel suave
    doc.setFillColor(250, 240, 255); // lavanda muy clara
    doc.rect(0, 0, 210, 297, "F");

    // Título
    doc.setFontSize(22);
    doc.setTextColor(123, 31, 162); // violeta intenso
    doc.setFont("helvetica", "bold");
    doc.text(businessName || "Presupuesto", 105, y, { align: "center" });

    y += 12;
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Fecha: ${new Date().toLocaleDateString()}`,
      200,
      y,
      { align: "right" }
    );

    y += 15;

    // Encabezados con fondo rosa pastel
    doc.setFillColor(255, 228, 241); // rosa suave
    doc.rect(10, y - 5, 190, 10, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(95, 0, 128); // violeta oscuro
    doc.text("Artículo", 12, y);
    doc.text("Cant.", 125, y);
    doc.text("Subtotal", 200, y, { align: "right" });

    y += 5;
    doc.setDrawColor(130);
    doc.line(10, y, 200, y); // línea debajo encabezado
    y += 8;

    // Items
    selected.forEach(item => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);

      // Alternar colores de fila pastel
      if (selected.indexOf(item) % 2 === 0) {
        doc.setFillColor(245, 235, 250); // lavanda muy clara
        doc.rect(10, y - 4, 190, 8, "F");
      }

      doc.text(item.name, 12, y);
      doc.text(String(item.quantity), 125, y);
      doc.text(
        `$${(item.price * item.quantity).toLocaleString()}`,
        200,
        y,
        { align: "right" }
      );

      y += 8;

      // Salto de página
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
    });

    y += 10;
    doc.setDrawColor(150);
    doc.line(10, y, 200, y);

    y += 10;

    // Total con fondo violeta pastel
    doc.setFillColor(230, 210, 255); // violeta pastel
    doc.rect(120, y - 6, 80, 12, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(123, 31, 162);
    doc.text(`TOTAL: $${total.toLocaleString()}`, 200, y, { align: "right" },);

    // Descargar
    doc.save(comprador + ".pdf");
  };


  const removeItem = (id: number) => {
    setSelected(prev =>
      prev
        .map(i =>
          i.id === id
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter(i => i.quantity > 0)
    );
  };

  const total = selected.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  /* =======================
     UI
  ======================= */

  return (
  <div className="min-h-screen bg-sky-50 flex justify-center pb-36">
    {/* Contenedor centrado */}
    <div className="w-full max-w-md">

      {/* Header */}
      <header className="bg-indigo-200 text-violet-900 p-5 text-center rounded-b-3xl shadow-sm">
        <h1 className="text-xl font-bold">costos-app</h1>
        <p className="text-xs opacity-80">
          Presupuesto desde Excel
        </p>
      </header>

      <div className="px-4 mt-4">
        <input
          type="text"
          placeholder="Nombre del emprendimiento"
          value={businessName}
          onChange={e => setBusinessName(e.target.value)}
          className="w-full rounded-xl border border-violet-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>

      <div className="px-4 mt-4">
        <input
          type="text"
          placeholder="Nombre del comprador"
          value={comprador}
          onChange={e => setComprador(e.target.value)}
          className="w-full rounded-xl border border-violet-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>


      

      {/* Upload */}
      <div className="p-4">
        <label className="block bg-white rounded-2xl border border-violet-100 p-5 text-center cursor-pointer hover:bg-violet-50 transition">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <p className="font-semibold text-violet-700">
            📂 Cargar Excel
          </p>
          <p className="text-xs text-violet-400 mt-1">
            Secciones + precios
          </p>
        </label>
      </div>

      {/* Secciones */}
      <main className="px-4 space-y-8">
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-violet-500 mb-3 uppercase tracking-wide">
              {section.title}
            </h2>

            <div className="bg-white rounded-2xl divide-y divide-violet-100 shadow-sm">
              {section.items.map(c => {
                const selectedItem = selected.find(i => i.id === c.id);
                const qty = selectedItem?.quantity || 0;

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {c.name}
                      </p>

                      {qty > 0 && (
                        <p className="text-sm font-bold text-emerald-600">
                          ${(c.price * qty).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Controles */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeItem(c.id)}
                        className="w-9 h-9 rounded-full bg-rose-200 text-rose-700 text-lg"
                      >
                        −
                      </button>

                      <span className="w-6 text-center font-semibold text-slate-700">
                        {qty}
                      </span>

                      <button
                        onClick={() => addItem(c)}
                        className="w-9 h-9 rounded-full bg-emerald-400 text-white text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
      
      {/* Botón para descargar  PDFs */}
      {selected.length > 0 && (
        <div className="px-4 mt-6">
          <button
            onClick={generatePDF}
            className="w-full bg-emerald-400 hover:bg-emerald-500 text-white font-semibold py-3 rounded-2xl transition"
          >
            📄 Descargar PDF
          </button>
        </div>
      )}


        {/* Total fijo */}
        <footer className="fixed bottom-0 left-0 right-0 bg-violet-200 p-5">
          <div className="flex justify-between items-center max-w-md mx-auto text-violet-900">
            <span className="text-sm font-semibold uppercase tracking-wide">
              Total
            </span>
            <span className="text-4xl font-extrabold">
              ${total.toLocaleString()}
            </span>
          </div>
        </footer>

    </div>
  </div>
);

}
