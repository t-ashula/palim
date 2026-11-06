const currentScriptOrder = [document.currentScript.id];
const innerScript = document.createElement("script");
innerScript.id = "inner";
innerScript.textContent = "currentScriptOrder.push(document.currentScript.id);";
document.body.appendChild(innerScript);
currentScriptOrder.push(document.currentScript.id);
document.body.setAttribute(
  "data-current-script-order",
  currentScriptOrder.join(","),
);
