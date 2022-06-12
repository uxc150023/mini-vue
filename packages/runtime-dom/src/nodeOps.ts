export const nodeOps = {
  // 增 删 改 查
  insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor); //  insertBefore等价于appendChild
  },
  remove(child) {
    const parentNode = child.parentNode;
    if (parentNode) {
      parentNode.removeChild(child);
    }
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  setText(node, text) {
    // node: document.createTextNode()
    node.nodeValue = text;
  },
  querySelector(selector) {
    return document.querySelector(selector);
  },
  parentNode(node) {
    return node.parentNode;
  },
  /**
   * 获取兄弟节点
   * @param node
   * @returns
   */
  nextSibling(node) {
    return node.nextSibling;
  },
  createElement(tagName) {
    return document.createElement(tagName);
  },
  createText(text) {
    return document.createTextNode(text);
  },
  // 文本节点，元素中的内容
};
