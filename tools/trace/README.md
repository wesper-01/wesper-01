# The trace

The second image on the profile replays a real run of `wesper.cpp`.

- `listing.txt`: `objdump -d -M intel` of `main`, built with `g++ 13.3 -O1 -no-pie -fno-pic` on x86-64 Linux.
- `trace.txt`: one line per instruction executed, recorded with gdb (`nexti`, stepping over the call): `T <rip> <rbx> <edi>`, taken before the instruction runs.

`tools/build-sheets.mjs` reads `trace.txt` and draws it. To change the program, rebuild both files the same way.
