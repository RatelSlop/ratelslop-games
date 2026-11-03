# RatelSlop Pocket

An offline, standalone Python launcher with six simplified calculator games for
NumWorks N0120, targeting stock Epsilon 25.2.0. The release is one ASCII script,
using only `kandinsky`, `ion`, `time` and `random`, with a 320 × 222 drawing area.
No firmware modification or external Python package is needed.

The games preserve their main mechanics: maze escape, road crossings, security
camera anomaly reports, drone dodging, tower defense and supermarket stock/checkout.
They are separate 2D adaptations. Browser assets, photographs, MP3 files and persistent
disk saves are not included. Records live only in the current Python session.

Build and test with `python ports/numworks/build.py`. This runs the desktop logic
tests, verifies Python 3.4 syntax and the storage budget, and produces:

- `dist/numworks/ratelslop.py`: compact, AST-equivalent calculator script.
- `dist/numworks/ratelslop-numworks.zip`: script and installation instructions.
- `dist/numworks/index.html`: download and setup instructions.

See [START-HERE.txt](START-HERE.txt) for USB transfer and per-game controls. Use
the calculator's DEL/backspace key for the launcher menu; Back may interrupt Python.
ALPHA pauses simulation time, and OK resumes.

Validation combines automated CPython game/maze/input tests and the official
NumWorks browser emulator. The available emulator identifies itself as 26.3.0;
physical N0120 / 25.2.0 execution has not been directly verified. APIs are restricted
to the stock documented Python interface, including its lack of `bytearray`.

Primary references:

- [NumWorks Python manual](https://www.numworks.com/manual/python/)
- [Official graphing emulator](https://www.numworks.com/emulator/graphing/)
- [Official Python key module](https://github.com/numworks/epsilon/blob/master/epsilon/python/port/mod/ion/modion_table.cpp)

The existing browser games and launcher remain separate from this edition.
