import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { createAppConfig } from "../../eslint.app.mjs";

export default createAppConfig(import.meta.url, [...nextVitals, ...nextTypescript]);
