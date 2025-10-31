// save as build-plugin.js
import fs from "fs";
import path from "path";
import archiver from "archiver";

const pluginDir = path.resolve("./plugin");
const outputZip = path.resolve("./plugin.zip");

// hapus zip lama biar gak numpuk
if (fs.existsSync(outputZip)) fs.unlinkSync(outputZip);

// bikin stream output zip baru
const output = fs.createWriteStream(outputZip);
const archive = archiver("zip", { zlib: { level: 9 } });

// log hasil selesai
output.on("close", () => {
  console.log(`✅ plugin.zip berhasil dibuat! (${archive.pointer()} bytes)`);
});

archive.on("error", (err) => {
  throw err;
});

// mulai proses zip
archive.pipe(output);
archive.directory(pluginDir, false, {
  ignore: ["node_modules/**"]
});
archive.finalize();