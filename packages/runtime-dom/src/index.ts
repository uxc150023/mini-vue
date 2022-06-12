import { createRenderer } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

export * from "@vue/runtime-core";

const renderOptions = Object.assign(nodeOps, { patchProp });

export function render(vnode, container) {
  createRenderer(renderOptions).render(vnode, container);
}

// createRenderer(
//   renderOptions.render(h("h1", "hello"), document.getElementById("app")),
// );
