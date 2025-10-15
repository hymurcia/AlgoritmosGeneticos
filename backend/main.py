from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from copy import deepcopy

app = Flask(__name__)
CORS(app)

AREA_MAXIMA = 50.0
UMBRAL_EFICIENCIA = 100


@app.route("/")
def home():
    return jsonify({"status": "API del Algoritmo Genético funcionando correctamente."})


@app.route("/run", methods=["POST"])
def run_ga():
    data = request.get_json()
    catalogo = data.get("catalogo", [])
    TAM_POBLACION = int(data.get("population_size", 200))
    NUM_GENERACIONES = int(data.get("generations", 200))
    PROB_CRUCE = float(data.get("pc", 0.6))
    PROB_MUTACION = float(data.get("pm", 0.15))
    TAM_TORNEO = int(data.get("tournament_size", 3))
    ELITISMO = 2 if data.get("elitism", True) else 0
    SELECCION = data.get("selection_type", "torneo")  # 🟢 nuevo campo

    random.seed(data.get("seed", 42))

    # -------- Funciones GA --------
    def crear_individuo():
        return [random.randint(0, art["stock"]) for art in catalogo]

    def decodificar(individuo):
        area = sum(cant * art["area"] for cant, art in zip(individuo, catalogo))
        beneficio = sum(cant * art["beneficio"] for cant, art in zip(individuo, catalogo))
        return area, beneficio

    def aptitud(individuo, penalizacion=1000.0):
        area, beneficio = decodificar(individuo)
        if area > AREA_MAXIMA:
            beneficio -= penalizacion * (area - AREA_MAXIMA)
        for cant, art in zip(individuo, catalogo):
            if cant > 0:
                eficiencia = art["beneficio"] / art["area"]
                if eficiencia < UMBRAL_EFICIENCIA:
                    beneficio -= (UMBRAL_EFICIENCIA - eficiencia) * cant * 0.3
        return beneficio

    def seleccion_torneo(poblacion, valores, k=3):
        seleccionados = random.sample(range(len(poblacion)), k)
        mejor = max(seleccionados, key=lambda i: valores[i])
        return deepcopy(poblacion[mejor])
    
    def seleccion_ruleta(poblacion, valores):
        total = sum(valores)
        if total <= 0:
            # si los valores son negativos o cero, ajustamos
            valores = [v - min(valores) + 1e-6 for v in valores]
            total = sum(valores)
        pick = random.uniform(0, total)
        current = 0
        for ind, val in zip(poblacion, valores):
            current += val
            if current >= pick:
                return deepcopy(ind)
        return deepcopy(poblacion[-1])  # fallback

    def cruce_uniforme(p1, p2, prob=0.5):
        h1, h2 = p1.copy(), p2.copy()
        for i in range(len(p1)):
            if random.random() < prob:
                h1[i], h2[i] = h2[i], h1[i]
        return h1, h2

    def mutar(individuo, prob=0.1):
        for i in range(len(individuo)):
            if random.random() < prob:
                r = random.random()
                if r < 0.45:
                    individuo[i] = max(0, individuo[i] - 1)
                elif r < 0.9:
                    individuo[i] = min(catalogo[i]["stock"], individuo[i] + 1)
                else:
                    individuo[i] = random.randint(0, catalogo[i]["stock"])
        return individuo

    # -------- Inicialización --------
    poblacion = [crear_individuo() for _ in range(TAM_POBLACION)]
    valores = [aptitud(ind) for ind in poblacion]
    mejor_global = None
    mejor_aptitud = -1e9
    historial = []

    # -------- Evolución --------
    for _ in range(NUM_GENERACIONES):
        pares = list(zip(poblacion, valores))
        pares.sort(key=lambda x: x[1], reverse=True)
        if pares[0][1] > mejor_aptitud:
            mejor_aptitud = pares[0][1]
            mejor_global = deepcopy(pares[0][0])
        historial.append(pares[0][1])

        nueva = [deepcopy(pares[i][0]) for i in range(ELITISMO)]
        while len(nueva) < TAM_POBLACION:
            if SELECCION == "ruleta":
                p1 = seleccion_ruleta(poblacion, valores)
                p2 = seleccion_ruleta(poblacion, valores)
            else:
                p1 = seleccion_torneo(poblacion, valores, TAM_TORNEO)
                p2 = seleccion_torneo(poblacion, valores, TAM_TORNEO)

            if random.random() < PROB_CRUCE:
                h1, h2 = cruce_uniforme(p1, p2)
            else:
                h1, h2 = deepcopy(p1), deepcopy(p2)
            h1 = mutar(h1, PROB_MUTACION)
            h2 = mutar(h2, PROB_MUTACION)
            nueva.extend([h1, h2])
        poblacion = nueva[:TAM_POBLACION]
        valores = [aptitud(ind) for ind in poblacion]

    # -------- Resultados --------
    mejor_area, mejor_beneficio = decodificar(mejor_global)
    utilizacion_area_percent = round(mejor_area / AREA_MAXIMA * 100, 2)

    articulos = []
    for cantidad, art in zip(mejor_global, catalogo):
        if cantidad > 0:
            articulos.append({
                "nombre": art["nombre"],
                "cantidad": cantidad,
                "area": art["area"],
                "beneficio": art["beneficio"],
                "total_area": art["area"] * cantidad,
                "total_beneficio": art["beneficio"] * cantidad,
            })

    # -------- Plano 2D (relleno proporcional) --------
    placements = []
    ancho_total = 10.0
    x, y = 0, 0
    altura_fila = 0
    for art in articulos:
        w = (art["total_area"]) ** 0.5 * 1.5
        h = w * 0.8
        if x + w > ancho_total:
            x = 0
            y += altura_fila + 0.2
            altura_fila = 0
        placements.append({
            "x": x,
            "y": y,
            "w": w,
            "h": h,
            "nombre": art["nombre"]
        })
        x += w + 0.2
        altura_fila = max(altura_fila, h)

    return jsonify({
        "mejor_beneficio": round(mejor_beneficio, 2),
        "mejor_area": round(mejor_area, 2),
        "utilizacion_area_percent": utilizacion_area_percent,
        "articulos_seleccionados": articulos,
        "placements": placements,
        "historial": historial
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
