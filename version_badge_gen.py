import argparse
import os
import osmnx as ox
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

PALETTES = {
    'zinc-accent-emerald': {
        'ring': '#10B981',       # Яскравий смарагд для кільця / головних артерій
        'secondary': '#71717A',  # Zinc-500 для з'єднувальних вулиць
        'grid': '#27272A',       # Тонкий Zinc-800 для міського полотна
    },
    'zinc-dark': {
        'ring': '#FAFAFA',       # Білий фокус
        'secondary': '#71717A',  # Світліший сірий
        'grid': '#27272A',       # Темна сітка
    },
    'zinc-light': {
        'ring': '#09090B',       # Чорний графіт
        'secondary': '#71717A',  # Середній сірий
        'grid': '#E4E4E7',       # М'який світлий цинк для світлого фону
    }
}

def generate_city_badge(
    city: str,
    palette_name: str = "zinc-accent-emerald",
    output_path: str = "badge.svg",
    dist: int = 1200
):
    print(f"1. Завантаження дорожнього полотна для: {city} (радіус {dist}м)...")
    
    # network_type='drive' дає чисту геометрію без пішохідних стежок і сходів
    G = ox.graph_from_address(city, dist=dist, network_type='drive')

    palette = PALETTES.get(palette_name, PALETTES['zinc-accent-emerald'])

    lines = []
    colors = []
    widths = []
    alphas = []

    print("2. Розрахунок візуальної ієрархії...")
    for u, v, k, data in G.edges(keys=True, data=True):
        hw = data.get('highway', 'residential')
        if isinstance(hw, list):
            hw = hw[0]

        # Отримуємо точну згладжену геометрію дороги
        if 'geometry' in data:
            xs, ys = data['geometry'].xy
            line = list(zip(xs, ys))
        else:
            line = [(G.nodes[u]['x'], G.nodes[u]['y']), (G.nodes[v]['x'], G.nodes[v]['y'])]

        lines.append(line)

        # ── 3 Рівні глибини замість "картоплини у вакуумі" ──
        if hw in {'motorway', 'trunk', 'primary'}:
            # Рівень 1: Кільце та магістралі (головний акцент)
            colors.append(palette['ring'])
            widths.append(2.2)
            alphas.append(1.0)
        elif hw in {'secondary', 'tertiary'}:
            # Рівень 2: З'єднувальні артерії
            colors.append(palette['secondary'])
            widths.append(1.1)
            alphas.append(0.7)
        else:
            # Рівень 3: Вулички міста (створюють текстуру і силует)
            colors.append(palette['grid'])
            widths.append(0.5)
            alphas.append(0.4)

    print("3. Рендеринг векторного бейджа...")
    fig, ax = plt.subplots(figsize=(6, 6))

    # Створюємо чисті векторні лінії
    lc = LineCollection(
        lines,
        colors=colors,
        linewidths=widths,
        alpha=alphas,
        capstyle='round',
        joinstyle='round'
    )
    ax.add_collection(lc)

    ax.autoscale()
    ax.set_aspect('equal')
    ax.axis('off')

    fig.patch.set_alpha(0.0)
    ax.patch.set_alpha(0.0)

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    print(f"4. Збереження в {output_path}...")
    plt.savefig(
        output_path,
        transparent=True,
        bbox_inches='tight',
        pad_inches=0.02
    )
    plt.close(fig)
    print("Готово!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--city", default="Dortmund, Germany")
    parser.add_argument("--palette", default="zinc-accent-emerald")
    parser.add_argument("--dist", type=int, default=1200)
    parser.add_argument("--out", default="./Assets/badges/badge.svg")

    args = parser.parse_args()
    generate_city_badge(args.city, palette_name=args.palette, output_path=args.out, dist=args.dist)