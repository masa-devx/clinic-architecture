import { setupServer } from "msw/node";

// テストごとに server.use(...) で、その場面の応答を決める
export const server = setupServer();
