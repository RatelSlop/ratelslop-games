import ast
import importlib.util
from pathlib import Path
import random
import sys
import types
import unittest

ROOT = Path(__file__).parent


class PortTests(unittest.TestCase):
    def setUp(self):
        self.rectangles = []
        self.strings = []
        graphics = types.ModuleType('kandinsky')
        graphics.fill_rect = self.rect
        graphics.draw_string = self.draw
        keypad = types.ModuleType('ion')
        keypad.keydown = lambda key: False
        sys.modules['kandinsky'] = graphics
        sys.modules['ion'] = keypad
        spec = importlib.util.spec_from_file_location('pocket', ROOT / 'ratelslop.py')
        self.game = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.game)
        self.game.release = lambda: None
        self.frames = 0

    def rect(self, *args):
        self.assertEqual(len(args), 5)
        self.assertTrue(all(isinstance(x, int) for x in args[:4]))
        self.assertGreaterEqual(args[2], 0)
        self.assertGreaterEqual(args[3], 0)
        self.rectangles.append(args)
        if len(self.rectangles) > 100:
            del self.rectangles[:50]

    def draw(self, *args):
        self.assertTrue(0 <= args[2] <= 204, 'text must fit the Python graphics area')
        self.strings.append(args[0])
        if len(self.strings) > 100:
            del self.strings[:50]

    def driver(self, control, limit=5000):
        def poll():
            self.frames += 1
            self.assertLess(self.frames, limit, 'game must terminate')
            return control(self.frames)
        self.game.poll = poll

    def test_python34_and_storage_budget(self):
        source = (ROOT / 'ratelslop.py').read_text()
        ast.parse(source, feature_version=(3, 4))
        self.assertLess(len(source.encode()), 24 * 1024)
        self.assertFalse(any(t in source for t in ('import os', 'import sys', 'import gc', 'bytearray(')))

    def test_generated_maze_has_closed_edges_and_reachable_floor(self):
        for seed in range(100):
            random.seed(seed)
            board = self.game.maze()
            distances = self.game.distances(board, 16)
            self.assertTrue(all(c or distances[i] >= 0 for i, c in enumerate(board)))
            for y in range(11):
                self.assertEqual(board[y * 15], 1)
                self.assertEqual(board[y * 15 + 14], 1)
            self.assertTrue(all(board[x] and board[150 + x] for x in range(15)))

    def test_all_six_games_render_and_return_to_menu(self):
        for name in ('achterkamers', 'bouncykoen', 'concierge', 'uavpilot', 'defense', 'shop'):
            with self.subTest(name=name):
                self.frames = 0
                self.driver(lambda n: (self.game.MENU if n == 5 else 0, 0, .05))
                self.assertIsNone(getattr(self.game, name)())
                self.assertTrue(self.rectangles)

    def test_chasers_eventually_catch_stationary_player(self):
        self.driver(lambda n: (0, 0, .1))
        score, won = self.game.achterkamers()
        self.assertFalse(won)
        self.assertLess(score, 400)

    def test_bouncy_boundary_loss(self):
        self.driver(lambda n: (self.game.LEFT, 0, .1))
        self.assertEqual(self.game.bouncykoen(), (0, False))

    def test_concierge_can_survive_by_reporting_observed_anomalies(self):
        self.game.randrange = lambda n: 0
        def control(n):
            # Observe the open doorway from the previous rendered frame.
            anomaly = any(r[:4] == (50, 70, 45, 90) and r[4] == self.game.BG
                          for r in self.rectangles[-12:])
            return 0, self.game.OK if anomaly else 0, .1
        self.driver(control)
        score, won = self.game.concierge()
        self.assertTrue(won)
        self.assertGreater(score, 600)

    def test_uav_can_complete_all_twenty_gates(self):
        self.game.randrange = lambda n: 100
        self.driver(lambda n: (0, 0, .1))
        self.assertEqual(self.game.uavpilot(), (1000, True))

    def test_defense_all_waves_can_be_won_with_upgrades(self):
        self.driver(lambda n: (0, self.game.OK | self.game.RIGHT | self.game.SHIFT, .1), 10000)
        score, won = self.game.defense()
        self.assertTrue(won)
        self.assertGreater(score, 1000)

    def test_shop_twenty_customers_can_be_served(self):
        self.driver(lambda n: (0, self.game.RIGHT | self.game.OK | self.game.SHIFT, .1))
        self.assertEqual(self.game.shop(), (2060, True))

    def test_menu_selects_each_game_and_exits(self):
        for selected in range(6):
            self.frames = 0
            self.driver(lambda n: (0, self.game.DOWN if n <= selected else self.game.OK, .1))
            self.assertEqual(self.game.menu(), selected)
        self.driver(lambda n: (0, self.game.MENU, .1))
        self.assertEqual(self.game.menu(), -1)

    def test_results_record_score_and_return_cleanly(self):
        choices = iter((0, -1))
        self.game.menu = lambda: next(choices)
        self.game.achterkamers = lambda: (500, True)
        self.driver(lambda n: (0, self.game.MENU, .1))
        self.game.main()
        self.assertEqual(self.game.BEST[0], 500)


if __name__ == '__main__':
    unittest.main()
