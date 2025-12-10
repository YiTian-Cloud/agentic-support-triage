import { getCompiledGraph } from "../lib/agent";

test("graph compiles successfully", () => {
  const graph = getCompiledGraph();
  expect(graph).toBeDefined();
});
