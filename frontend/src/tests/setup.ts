import "@testing-library/jest-dom";
import { afterEach } from "@jest/globals";
import { act } from "@testing-library/react";
import { TextDecoder, TextEncoder } from "node:util";
import { resetAllStores } from "./storeReset";

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
});

afterEach(() => {
  act(() => {
    resetAllStores();
  });
});
