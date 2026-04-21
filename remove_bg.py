from PIL import Image
import numpy as np
from collections import deque

INPUT  = "app/docs/design-reference/logo-nobg.png"
OUTPUT = "app/apps/web-client/public/logo-nobg.png"

img = Image.open(INPUT).convert("RGBA")
data = np.array(img, dtype=np.int32)
h, w = data.shape[:2]

def is_bg(y, x):
    r, g, b, a = data[y, x]
    if a == 0:
        return True
    brightness = (r + g + b) / 3
    max_dev = max(abs(r - brightness), abs(g - brightness), abs(b - brightness))
    return brightness > 200 and max_dev < 30

visited = np.zeros((h, w), dtype=bool)
queue = deque()

# Semear flood-fill a partir de todas as bordas
for y in range(h):
    for x in [0, w - 1]:
        if not visited[y, x] and is_bg(y, x):
            visited[y, x] = True
            queue.append((y, x))
for x in range(w):
    for y in [0, h - 1]:
        if not visited[y, x] and is_bg(y, x):
            visited[y, x] = True
            queue.append((y, x))

# BFS
while queue:
    y, x = queue.popleft()
    data[y, x, 3] = 0  # transparente
    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg(ny, nx):
            visited[ny, nx] = True
            queue.append((ny, nx))

# Suavizar borda: reduzir alpha dos pixels de borda (anti-aliasing)
result_data = data.copy()
removed = visited  # pixels que viraram transparentes
for y in range(1, h - 1):
    for x in range(1, w - 1):
        if not removed[y, x] and data[y, x, 3] > 0:
            # Se algum vizinho foi removido, suavizar alpha
            neighbors_removed = sum(
                removed[y + dy, x + dx]
                for dy, dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]
            )
            if neighbors_removed > 0:
                r, g, b, a = data[y, x]
                brightness = (r + g + b) / 3
                # Quanto mais claro o pixel de borda, mais transparente
                if brightness > 180:
                    fade = (brightness - 180) / 75.0
                    result_data[y, x, 3] = int(a * (1 - fade * 0.8))

Image.fromarray(result_data.astype(np.uint8)).save(OUTPUT)
print(f"Salvo em {OUTPUT}")
