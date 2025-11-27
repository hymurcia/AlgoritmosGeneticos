import React, { useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

export default function App() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const [catalogo, setCatalogo] = useState([
    { id: 1, nombre: "Mini nevera", area: 0.25, beneficio: 40, stock: 5 },
    { id: 2, nombre: "Televisor 32\"", area: 0.1125, beneficio: 60, stock: 6 },
    { id: 3, nombre: "Lavadora", area: 0.36, beneficio: 90, stock: 300 },
    { id: 4, nombre: "Microondas", area: 0.2, beneficio: 25, stock: 8 },
    { id: 5, nombre: "Aire acondicionado", area: 0.27, beneficio: 110, stock: 2 },
    { id: 6, nombre: "Licuadora", area: 0.04, beneficio: 8, stock: 10 },
    { id: 7, nombre: "Nevera grande", area: 0.6, beneficio: 220, stock: 2 },
    { id: 8, nombre: "Horno eléctrico", area: 0.36, beneficio: 65, stock: 3 },
    { id: 9, nombre: "Aspiradora", area: 0.0875, beneficio: 28, stock: 6 },
    { id: 10, nombre: "Plancha", area: 0.06, beneficio: 10, stock: 12 },
    { id: 11, nombre: "Cocina a gas", area: 0.48, beneficio: 130, stock: 2 },
    { id: 12, nombre: "Extractor cocina", area: 0.18, beneficio: 45, stock: 4 },
  ]);

const [params, setParams] = useState({
  population_size: 200,
  generations: 100,
  pc: 0.6,
  pm: 0.15,
  tournament_size: 3,
  elitism: true,
  seed: 42,
  selection_type: "torneo", // 🟢 nuevo campo
});
const API_BASE_URL = "https://hymurcia-algoritmos-api.onrender.com";

const run = async () => {
    setRunning(true);
    setResult(null);
    try {
        const res = await fetch(`${API_BASE_URL}/run`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...params, catalogo }),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        setResult(data);
    } catch (err) {
        // Mensaje de error ajustado para indicar la nueva URL
        alert(`No se pudo conectar con el backend en ${API_BASE_URL}.\nError: ${err.message}`);
    } finally {
        setRunning(false);
    }
};

  const downloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "resultados_ejemplo.json";
    a.click();
  };

  const handleCatalogChange = (index, field, value) => {
    const updated = [...catalogo];
    updated[index][field] = field === "nombre" ? value : parseFloat(value);
    setCatalogo(updated);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 flex justify-center">
      <div className="w-[90%] max-w-[1300px] bg-white shadow-xl rounded-2xl p-10">
        <h1 className="text-3xl font-bold text-center mb-10 text-indigo-700">
          Simulador GA - Optimización de Área
        </h1>

        {/* --- Catálogo --- */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3 text-gray-700">
            1. Catálogo de artículos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-indigo-100">
                <tr>
                  <th className="border px-3 py-2">Nombre</th>
                  <th className="border px-3 py-2">Área (m²)</th>
                  <th className="border px-3 py-2">Beneficio ($)</th>
                  <th className="border px-3 py-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {catalogo.map((art, i) => (
                  <tr key={art.id} className="even:bg-gray-50">
                    <td className="border px-2">
                      <input
                        className="w-full p-1"
                        value={art.nombre}
                        onChange={(e) => handleCatalogChange(i, "nombre", e.target.value)}
                      />
                    </td>
                    <td className="border px-2">
                      <input
                        type="number"
                        className="w-full p-1"
                        value={art.area}
                        onChange={(e) => handleCatalogChange(i, "area", e.target.value)}
                      />
                    </td>
                    <td className="border px-2">
                      <input
                        type="number"
                        className="w-full p-1"
                        value={art.beneficio}
                        onChange={(e) => handleCatalogChange(i, "beneficio", e.target.value)}
                      />
                    </td>
                    <td className="border px-2">
                      <input
                        type="number"
                        className="w-full p-1"
                        value={art.stock}
                        onChange={(e) => handleCatalogChange(i, "stock", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- Parámetros --- */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3 text-gray-700">
            2. Parámetros del algoritmo
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              ["Población", "population_size"],
              ["Generaciones", "generations"],
              ["Prob. Cruce (Pc)", "pc"],
              ["Prob. Mutación (Pm)", "pm"],
              ["Torneo (k)", "tournament_size"],
              ["Semilla", "seed"],
            ].map(([label, key]) => (
              <label key={key} className="flex flex-col text-sm">
                {label}:
                <input
                  type="number"
                  step="any"
                  className="p-2 border rounded-md mt-1"
                  value={params[key]}
                  onChange={(e) =>
                    setParams({ ...params, [key]: parseFloat(e.target.value) })
                  }
                />
              </label>
            ))}

            {/* Checkbox de elitismo */}
            <label className="flex flex-col justify-center text-sm">
              Elitismo:
              <input
                type="checkbox"
                checked={params.elitism}
                onChange={(e) =>
                  setParams({ ...params, elitism: e.target.checked })
                }
                className="w-5 h-5 mt-1 accent-indigo-600"
              />
            </label>
            {/* Método de selección */}
            <label className="flex flex-col text-sm">
            Método de selección:
            <select
                value={params.selection_type || "torneo"}
                onChange={(e) => setParams({ ...params, selection_type: e.target.value })}
                className="p-2 border rounded-md mt-1"
            >
                <option value="torneo">Torneo</option>
                <option value="ruleta">Ruleta</option>
            </select>
            </label>

          </div>

          <div className="flex gap-4">
            <button
              onClick={run}
              disabled={running}
              className={`px-8 py-2 text-white font-semibold rounded-md shadow-md transition ${
                running ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {running ? "Ejecutando..." : "Ejecutar GA"}
            </button>

            <button
              onClick={downloadJSON}
              disabled={!result}
              className="px-6 py-2 bg-green-600 text-white rounded-md shadow-md disabled:opacity-50 hover:bg-green-700"
            >
              Descargar resultados JSON
            </button>
          </div>
        </section>

        {/* --- Resultados --- */}
        {result && (
          <section>
            <h2 className="text-2xl font-semibold text-indigo-700 mb-3">
              3. Resultados
            </h2>
            <p className="mb-4 text-gray-700">
              <b>Beneficio total:</b> ${result.mejor_beneficio.toLocaleString()} <br />
              <b>Área usada:</b> {result.mejor_area} m² ({result.utilizacion_area_percent}%)
            </p>

            {/* Listado de artículos */}
            <h3 className="font-semibold mb-2 text-lg">Artículos seleccionados:</h3>
            <ul className="mb-6 list-disc list-inside text-sm text-gray-700">
              {result.articulos_seleccionados.map((a, i) => (
                <li key={i}>
                  {a.nombre} ×{a.cantidad} — Área total: {a.total_area.toFixed(2)} m² — Beneficio: $
                  {a.total_beneficio.toFixed(2)}
                </li>
              ))}
            </ul>

            {/* Gráfica */}
            <div className="bg-gray-50 border rounded-lg p-4 mb-8">
              <h3 className="text-lg font-semibold mb-2">
                Gráfica de convergencia
              </h3>
              <div style={{ height: "250px" }}>
                <Line
                  data={{
                    labels: result.historial.map((_, i) => i + 1),
                    datasets: [
                      {
                        label: "Mejor aptitud por generación",
                        data: result.historial,
                        borderColor: "#4f46e5",
                        tension: 0.25,
                        fill: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>

        {/* Plano 2D dinámico (colores sincronizados + leyenda detallada) */}
<div className="bg-gray-50 border rounded-lg p-4">
  <h3 className="text-lg font-semibold mb-4">Plano 2D de artículos (escala dinámica)</h3>

  <div className="flex flex-col md:flex-row gap-4">
    {/* Plano 2D */}
    <div className="relative rounded-lg border border-gray-300 bg-gray-200 overflow-hidden w-[800px] h-[400px] grid grid-cols-[repeat(100,1fr)] grid-rows-[repeat(50,1fr)]">
      {(() => {
        if (!result.articulos_seleccionados || result.articulos_seleccionados.length === 0)
          return Array.from({ length: 5000 }).map((_, i) => (
            <div key={i} className="bg-gray-100" />
          ));

        // 🎨 Paleta de colores fija
        const colores = [
          "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
          "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#F43F5E",
        ];

        // 🟦 Asignar color fijo a cada artículo
        const mapaColores = {};
        result.articulos_seleccionados.forEach((a, idx) => {
          mapaColores[a.nombre] = colores[idx % colores.length];
        });

        // 🧱 Dimensiones del plano: 100x50 = 5000 celdas (cada una = 0.01 m²)
        const totalCeldas = 5000;
        const celdas = [];
        let filled = 0;

        // 📏 Ordenar artículos por área total
        const articulosOrdenados = [...result.articulos_seleccionados].sort(
          (a, b) => (b.area * b.cantidad) - (a.area * a.cantidad)
        );

        // 🧩 Llenar plano
        for (let art of articulosOrdenados) {
          const color = mapaColores[art.nombre];
          const numCeldas = Math.round((art.area * art.cantidad) / 0.01);
          for (let i = 0; i < numCeldas && filled < totalCeldas; i++) {
            celdas.push(color);
            filled++;
          }
        }

        // 🔘 Rellenar celdas vacías
        while (filled < totalCeldas) {
          celdas.push("#E5E7EB");
          filled++;
        }

        // 🧱 Renderizado
        return celdas.map((color, i) => (
          <div
            key={i}
            style={{ backgroundColor: color }}
            className="transition-all hover:brightness-110"
          ></div>
        ));
      })()}
    </div>

    {/* 📋 Leyenda detallada */}
    <div className="flex flex-col justify-start gap-2 md:w-[30%] text-sm">
      <h4 className="font-medium mb-2">Leyenda:</h4>
      {result.articulos_seleccionados.map((a, idx) => {
        const color = [
          "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
          "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#F43F5E",
        ][idx % 10];
        const areaTotal = (a.area * a.cantidad).toFixed(2);
        return (
          <div key={idx} className="flex items-start gap-2 leading-tight">
            <span
              className="inline-block w-4 h-4 mt-[3px] rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            ></span>
            <span>
              <strong>{a.nombre}</strong><br />
              {a.cantidad} und × {a.area.toFixed(3)} m² c/u → <strong>{areaTotal} m² total</strong>
            </span>
          </div>
        );
      })}
    </div>
  </div>
</div>

          </section>
        )}
      </div>
    </div>
  );
}
