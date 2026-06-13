import net from "node:net";

const port = Number(process.argv[2]);
const host = process.argv[3] || "127.0.0.1";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid port for Lighthouse preview: ${process.argv[2]}`);
  process.exit(1);
}

const server = net.createServer();

server.once("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`Lighthouse preview port is already in use: ${host}:${port}`);
  } else {
    console.error(`Unable to verify Lighthouse preview port ${host}:${port}:`, error);
  }
  process.exit(1);
});

server.once("listening", () => {
  server.close(() => process.exit(0));
});

server.listen(port, host);
