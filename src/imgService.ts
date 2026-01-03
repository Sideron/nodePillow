import { spawn } from "child_process";

type CompareResult =
  | { ok: true; distance: number; raw: string }
  | { ok: false; error: string; details?: string };

export default function compareImages(
  f1: Express.Multer.File,
  f2: Express.Multer.File
): Promise<CompareResult> {
  return new Promise((resolve) => {
    // En Windows a veces conviene "py" en vez de "python"
    const py = spawn("python", ["-u", "./functions/imageComparison.py"]);

    let out = "";
    let err = "";

    // Si Python ni siquiera arranca (PATH, permisos, etc.)
    py.on("error", (e) => {
      resolve({ ok: false, error: "No se pudo iniciar Python", details: String(e) });
    });

    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));

    // IMPORTANTÍSIMO para evitar crash por write EOF
    py.stdin.on("error", (e) => {
      resolve({ ok: false, error: "Error escribiendo a stdin de Python", details: String(e) });
    });

    // Escribe: [len1][img1bytes][len2][img2bytes]
    const len1 = Buffer.alloc(4);
    len1.writeUInt32BE(f1.buffer.length, 0);

    const len2 = Buffer.alloc(4);
    len2.writeUInt32BE(f2.buffer.length, 0);

    py.stdin.write(len1);
    py.stdin.write(f1.buffer);
    py.stdin.write(len2);
    py.stdin.write(f2.buffer);
    py.stdin.end();

    py.on("close", (code) => {
      if (code !== 0) {
        return resolve({
          ok: false,
          error: "Python falló",
          details: err || `exit code ${code}`,
        });
      }

      const trimmed = out.trim();
      const distance = Number(trimmed);

      if (Number.isNaN(distance)) {
        return resolve({
          ok: false,
          error: "Salida inválida de Python (no es número)",
          details: `stdout="${trimmed}" stderr="${err.trim()}"`,
        });
      }

      resolve({ ok: true, distance, raw: trimmed });
    });
  });
}
