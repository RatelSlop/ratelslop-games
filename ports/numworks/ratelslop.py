# RatelSlop Pocket - NumWorks N0120 / Epsilon 25.2.0
# In the Python shell: from ratelslop import *; main()
from kandinsky import fill_rect, draw_string
from ion import keydown
from time import monotonic, sleep
from random import randrange

BG = (17, 20, 24)
FG = (240, 237, 218)
RED = (204, 45, 63)
GOLD = (224, 184, 94)
GREEN = (101, 194, 133)
BLUE = (44, 135, 205)
GRAY = (65, 72, 79)
LEFT, UP, DOWN, RIGHT = 1, 2, 4, 8
OK, MENU, SHIFT, PAUSE = 16, 32, 64, 128
NAMES = ('De Achterkamers', 'BouncyKoen', 'ConciergeDienst',
         'UAVPilot', 'De Laatste Les', 'AH Gennep')
HELP = ('Passen zoeken, terug naar groen', 'Omhoog: hop. Ontwijk verkeer',
        'Pijlen: camera. OK: afwijking', 'Vlieg door 20 openingen',
        'OK: bouwen. SHIFT: start golf', 'OK: aanvullen. SHIFT: afrekenen')
BEST = [0, 0, 0, 0, 0, 0]
held = 0
last = 0


def text(s, x, y, c=FG, bg=BG):
    draw_string(str(s), x, y, c, bg)


def clear():
    fill_rect(0, 0, 320, 222, BG)


def read():
    v = 0
    for key, bit in ((0, LEFT), (1, UP), (2, DOWN), (3, RIGHT),
                     (4, OK), (52, OK), (17, MENU), (12, SHIFT), (13, PAUSE)):
        if keydown(key):
            v |= bit
    return v


def release():
    global held, last
    while read():
        sleep(.02)
    held = 0
    last = monotonic()


def poll():
    global held, last
    sleep(.035)
    k = read()
    edge = k & ~held
    held = k
    now = monotonic()
    dt = min(.12, max(0, now - last))
    last = now
    if edge & PAUSE:
        fill_rect(25, 66, 270, 92, BG)
        text('PAUZE', 130, 76, GOLD)
        text('OK: verder   DEL: menu', 50, 108)
        release()
        while True:
            q = read()
            if q & (OK | MENU):
                release()
                return (q & MENU, 0, 0)
            sleep(.03)
    return k, edge, dt


def hud(s):
    fill_rect(0, 0, 320, 22, BG)
    text(s, 4, 2)


def face(x, y, color):
    fill_rect(x, y, 12, 13, color)
    fill_rect(x + 2, y + 3, 2, 2, BG)
    fill_rect(x + 8, y + 3, 2, 2, BG)
    fill_rect(x + 3, y + 9, 6, 2, BG)


def maze(w=15, h=11):
    board = [1] * (w * h)
    stack = [w + 1]
    board[w + 1] = 0
    while stack:
        i = stack[-1]
        x, y = i % w, i // w
        choices = []
        for dx, dy in ((0, -2), (2, 0), (0, 2), (-2, 0)):
            nx, ny = x + dx, y + dy
            if 0 < nx < w - 1 and 0 < ny < h - 1 and board[ny * w + nx]:
                choices.append((dx, dy))
        if not choices:
            stack.pop()
        else:
            dx, dy = choices[randrange(len(choices))]
            j = i + dx + dy * w
            board[i + dx // 2 + dy // 2 * w] = 0
            board[j] = 0
            stack.append(j)
    return board


def distances(board, start, w=15):
    dist = [-1] * len(board)
    dist[start] = 0
    queue = [start]
    q = 0
    while q < len(queue):
        i = queue[q]
        q += 1
        for j in (i - w, i + 1, i + w, i - 1):
            if 0 <= j < len(board) and not board[j] and dist[j] < 0:
                dist[j] = dist[i] + 1
                queue.append(j)
    return dist


def achterkamers():
    board = maze()
    p, start = 16, 16
    selected = [start]
    nearest = distances(board, start)
    for n in range(7):
        best = max(range(len(board)), key=lambda i: nearest[i])
        selected.append(best)
        d = distances(board, best)
        nearest = [min(a, b) for a, b in zip(nearest, d)]
    cards = selected[1:4]
    enemies = selected[4:8]
    colors = (GREEN, GOLD, BLUE, RED)
    timers = [0, 0, 0, 0]
    t, move, stamina, torch = 0, 0, 100, True
    release()
    while True:
        k, edge, dt = poll()
        if k & MENU:
            return
        t += dt
        move -= dt
        if edge & OK:
            torch = not torch
        sprint = bool(k & SHIFT and stamina > 1)
        stamina = max(0, min(100, stamina + (-30 if sprint else 18) * dt))
        delta = (-1 if k & LEFT else 1 if k & RIGHT else
                 -15 if k & UP else 15 if k & DOWN else 0)
        if delta and move <= 0:
            if not board[p + delta]:
                p += delta
            move = .10 if sprint else .18
        if p in cards:
            cards.remove(p)
        if p == start and not cards:
            return 600 + max(0, 400 - int(t)), True
        active = min(4, 4 - len(cards)) if t > 7 else 0
        d = distances(board, p) if active else None
        for i in range(active):
            timers[i] -= dt
            if timers[i] <= 0:
                e = enemies[i]
                choices = [j for j in (e - 15, e + 1, e + 15, e - 1)
                           if 0 <= j < len(board) and not board[j]]
                enemies[i] = min(choices, key=lambda j: d[j])
                timers[i] = (.55, .47, .40, .29)[i]
            if enemies[i] == p:
                return (3 - len(cards)) * 100, False
        clear()
        radius = 4 if torch else 1
        for y in range(11):
            for x in range(15):
                if abs(x - p % 15) + abs(y - p // 15) <= radius:
                    i = y * 15 + x
                    c = (119, 111, 69) if board[i] else (39, 38, 25)
                    fill_rect(25 + x * 18, 23 + y * 18, 18, 18, c)
                    if i == start:
                        fill_rect(30 + x * 18, 28 + y * 18, 8, 8, GREEN)
                    if i in cards:
                        fill_rect(31 + x * 18, 28 + y * 18, 6, 9, GOLD)
        for i in range(active):
            e = enemies[i]
            if abs(e % 15 - p % 15) + abs(e // 15 - p // 15) <= radius:
                face(28 + e % 15 * 18, 25 + e // 15 * 18, colors[i])
        fill_rect(31 + p % 15 * 18, 29 + p // 15 * 18, 6, 6, FG)
        hud('Passen %d/3  Adem %d' % (3 - len(cards), int(stamina)))


def traffic(lane, t):
    direction = 1 if lane % 2 else -1
    return (t * (1.2 + lane % 3 * .25) * direction + lane * 2.7) % 14 - 2


def bouncykoen():
    x, lane, best, t, delay = 5.0, 0, 0, 0, 0
    release()
    while True:
        k, edge, dt = poll()
        if k & MENU:
            return
        t += dt
        delay -= dt
        if delay <= 0:
            if k & UP:
                lane += 1
            elif k & DOWN:
                lane = max(0, lane - 1)
            elif k & LEFT:
                x -= 1
            elif k & RIGHT:
                x += 1
            delay = .17
        best = max(best, lane)
        if best >= 40:
            return best * 10, True
        water = lane % 7 == 3
        pos = traffic(lane, t)
        hit = any(a - .35 < x < a + 1.55 for a in (pos, pos + 7, pos - 7))
        if water:
            if not hit:
                return best * 10, False
            x += (.6 if lane % 2 else -.6) * dt
        elif lane % 5 and hit:
            return best * 10, False
        if x < 0 or x > 10:
            return best * 10, False
        clear()
        for row in range(10):
            world = lane + 8 - row
            river = world > 0 and world % 7 == 3
            safe = world <= 0 or (world % 5 == 0 and not river)
            color = (35, 91, 66) if safe else BLUE if river else GRAY
            fill_rect(6, 24 + row * 19, 308, 18, color)
            if not safe or river:
                a = traffic(world, t)
                for car in (a, a + 7, a - 7):
                    xx = int(6 + car * 28)
                    if -40 < xx < 320:
                        fill_rect(xx, 27 + row * 19, 45, 12, GOLD if river else RED)
        face(int(6 + x * 28), 178, FG)
        hud('BouncyKoen  %d/40' % best)


def concierge():
    camera, t, spawn, reports, strikes = 0, 0, 5, 0, 0
    anomalies = [0, 0, 0, 0]
    release()
    while True:
        k, edge, dt = poll()
        if k & MENU:
            return
        t += dt
        spawn -= dt
        if edge & LEFT:
            camera = (camera - 1) % 4
        if edge & RIGHT:
            camera = (camera + 1) % 4
        if spawn <= 0:
            c = randrange(4)
            if not anomalies[c]:
                anomalies[c] = 1 + randrange(4)
            spawn = 5
        if edge & OK:
            if anomalies[camera]:
                anomalies[camera] = 0
                reports += 1
            else:
                strikes += 1
        danger = sum(1 for a in anomalies if a)
        if danger >= 3 or strikes >= 3:
            return reports * 100, False
        if t >= 60:
            return 600 + reports * 100, True
        clear()
        fill_rect(15, 42, 290, 153, (38, 45, 47))
        fill_rect(15, 160, 290, 35, GRAY)
        a = anomalies[camera]
        fill_rect(50, 70, 45, 90, BG if a == 1 else BLUE)
        fill_rect(126, 67, 58, 42, (95, 113, 127))
        fill_rect(154, 67, 3, 42, FG)
        fill_rect(126, 87, 58, 3, FG)
        fill_rect(110, 145, 50, 10, GOLD)
        if a != 2:
            fill_rect(210, 145, 50, 10, GOLD)
        if a == 3:
            face(225, 105, RED)
        text('66:66' if a == 4 else '12:00', 217, 62, FG, (38, 45, 47))
        hud('CAM %d  Risico %d/3  %ds' % (camera + 1, danger, int(60 - t)))
        text('Basis: 2 tafels, deur dicht', 25, 200)


def uavpilot():
    x, y, gates, score, spawn = 160.0, 175.0, [], 0, 0
    release()
    while True:
        k, edge, dt = poll()
        if k & MENU:
            return
        x = max(8, min(312, x + ((bool(k & RIGHT)) - bool(k & LEFT)) * 100 * dt))
        y = max(55, min(207, y + ((bool(k & DOWN)) - bool(k & UP)) * 75 * dt))
        spawn -= dt
        if spawn <= 0:
            gates.append([float(-20), 60 + randrange(200), False])
            spawn = 1.6
        for gate in gates:
            gate[0] += (52 + score) * dt
            if abs(gate[0] - y) < 11 and abs(x - gate[1]) > 36:
                return score * 50, False
            if gate[0] > y + 12 and not gate[2]:
                gate[2] = True
                score += 1
        gates = [g for g in gates if g[0] < 225]
        if score >= 20:
            return score * 50, True
        clear()
        fill_rect(0, 22, 320, 200, (28, 55, 66))
        for gate in gates:
            yy, gap = int(gate[0]), gate[1]
            if yy >= 22:
                fill_rect(0, yy, gap - 44, 10, RED)
                fill_rect(gap + 44, yy, 320 - gap - 44, 10, RED)
        fill_rect(int(x) - 12, int(y), 24, 4, FG)
        fill_rect(int(x) - 3, int(y) - 7, 6, 19, GOLD)
        hud('UAVPilot  Poorten %d/20' % score)


def route(p):
    points = ((0, 105), (60, 105), (60, 65), (200, 65), (200, 150), (320, 150))
    for i in range(5):
        x, y = points[i]
        xx, yy = points[i + 1]
        length = abs(xx - x) + abs(yy - y)
        if p <= length:
            return x + (xx - x) * p / length, y + (yy - y) * p / length
        p -= length
    return 320, 150


def defense():
    pads = ((35, 72), (92, 95), (151, 95), (232, 95), (170, 180), (280, 180))
    levels, timers, enemies = [0] * 6, [0] * 6, []
    selected, money, lives, wave, todo, spawn, kills = 0, 60, 10, 0, 0, 0, 0
    release()
    while True:
        k, edge, dt = poll()
        if k & MENU:
            return
        if edge & LEFT:
            selected = (selected - 1) % 6
        if edge & RIGHT:
            selected = (selected + 1) % 6
        cost = 20 * (levels[selected] + 1)
        if edge & OK and levels[selected] < 3 and money >= cost:
            money -= cost
            levels[selected] += 1
        if edge & SHIFT and not enemies and todo == 0:
            wave += 1
            todo = 4 + wave
            spawn = 0
        spawn -= dt
        if todo and spawn <= 0:
            enemies.append([0.0, 2 + wave // 3])
            todo -= 1
            spawn = .7
        for enemy in enemies:
            enemy[0] += (20 + wave * 3) * dt
        for i in range(6):
            timers[i] -= dt
            if levels[i] and timers[i] <= 0:
                for enemy in enemies:
                    xx, yy = route(enemy[0])
                    if abs(xx - pads[i][0]) + abs(yy - pads[i][1]) < 70:
                        enemy[1] -= levels[i]
                        timers[i] = .5
                        break
        survivors = []
        for enemy in enemies:
            if enemy[1] <= 0:
                kills += 1
                money += 5
            elif enemy[0] >= 445:
                lives -= 1
            else:
                survivors.append(enemy)
        if enemies and not survivors and todo == 0:
            money += 15
        enemies = survivors
        if lives <= 0:
            return kills * 20, False
        if wave == 8 and not todo and not enemies:
            return 1000 + kills * 20, True
        clear()
        fill_rect(0, 99, 66, 12, GRAY)
        fill_rect(54, 59, 12, 52, GRAY)
        fill_rect(60, 59, 146, 12, GRAY)
        fill_rect(194, 65, 12, 91, GRAY)
        fill_rect(200, 144, 120, 12, GRAY)
        for i in range(6):
            x, y = pads[i]
            fill_rect(x - 12, y - 12, 24, 24, GOLD if i == selected else GRAY)
            text(str(levels[i]), x - 5, y - 9, BG, GOLD if i == selected else GRAY)
        for enemy in enemies:
            x, y = route(enemy[0])
            face(int(x) - 6, int(y) - 6, RED)
        hud('Golf %d/8  EUR %d  HP %d' % (wave, money, lives))
        text('OK: koop %d  SHIFT: golf' % cost, 20, 202)


def shop():
    products = ('Brood', 'Melk', 'Appels', 'Kaas', 'Pasta', 'Eieren')
    stock = [3] * 6
    selected, money, served, lost, t, spawn = 0, 0, 0, 0, 0, 1
    queue = []
    release()
    while True:
        k, edge, dt = poll()
        if k & MENU:
            return
        t += dt
        spawn -= dt
        if edge & LEFT:
            selected = (selected - 1) % 6
        if edge & RIGHT:
            selected = (selected + 1) % 6
        if edge & OK:
            stock[selected] = min(9, stock[selected] + 3)
        if edge & SHIFT and queue and stock[queue[0][0]]:
            stock[queue.pop(0)[0]] -= 1
            money += 3
            served += 1
        if spawn <= 0:
            queue.append([randrange(6), 12.0])
            spawn = 2.5
        for customer in queue:
            customer[1] -= dt
        while queue and queue[0][1] <= 0:
            queue.pop(0)
            lost += 1
        if served >= 20:
            return served * 100 + money, True
        if t >= 90 or lost >= 5:
            return served * 100 + money, False
        clear()
        for i in range(6):
            x, y = 8 + i % 3 * 104, 39 + i // 3 * 53
            color = BLUE if i == selected else GRAY
            fill_rect(x, y, 98, 46, color)
            text(products[i], x + 5, y + 3, FG, color)
            text('Stock %d' % stock[i], x + 5, y + 23, FG, color)
        if queue:
            text('Klant: ' + products[queue[0][0]], 9, 153, GOLD)
        text('OK: vul   SHIFT: kassa', 9, 178)
        text('Rij %d  Weg %d/5  %ds' % (len(queue), lost, int(90 - t)), 9, 201)
        hud('AH Gennep  %d/20  EUR %d' % (served, money))


def menu():
    selected = 0
    release()
    while True:
        clear()
        fill_rect(0, 0, 320, 27, RED)
        text('RATELSLOP POCKET', 12, 4, FG, RED)
        for i in range(6):
            y = 35 + i * 23
            c = GRAY if selected == i else BG
            fill_rect(8, y, 304, 22, c)
            text(('> ' if selected == i else '  ') + NAMES[i], 12, y + 2, FG, c)
        text(HELP[selected], 4, 180, GOLD)
        text('OK:spel DEL:menu ALPHA:pauze', 10, 203)
        while True:
            k, edge, dt = poll()
            if edge & UP:
                selected = (selected - 1) % 6
                break
            if edge & DOWN:
                selected = (selected + 1) % 6
                break
            if edge & OK:
                return selected
            if edge & MENU:
                return -1


def main():
    games = (achterkamers, bouncykoen, concierge, uavpilot, defense, shop)
    while True:
        selected = menu()
        if selected < 0:
            return
        while True:
            result = games[selected]()
            if result is None:
                break
            score, won = result
            BEST[selected] = max(BEST[selected], score)
            clear()
            text(NAMES[selected], 20, 30, GOLD)
            text('GEWONNEN!' if won else 'GAME OVER', 20, 70, GREEN if won else RED)
            text('Score: ' + str(score), 20, 105)
            text('Record: ' + str(BEST[selected]), 20, 130)
            text('OK: opnieuw   DEL: menu', 20, 180)
            release()
            while True:
                k, edge, dt = poll()
                if edge & (OK | MENU):
                    break
            if edge & MENU:
                break
