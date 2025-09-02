export const matchConfig = (configList, url = window.location.href) => {
  if (!Array.isArray(configList)) {
    throw new Error('configList is notArray')
  }

  if (configList.length === 0) {
    throw new Error('configList is empty')
  }

  const { pathname, search, hash } = new URL(url)

  return configList.find(config => {
    const { url_regex, url_search_regex, url_hash_regex, node_checkout_inspect } = config

    if (!url_regex && !url_search_regex && !url_hash_regex) {
      return false
    }

    if (url_regex && !url_regex.some(regexStr => new RegExp(regexStr).test(pathname))) {
      return false
    }

    if (url_search_regex && !url_search_regex.some(regexStr => new RegExp(regexStr).test(search))) {
      return false
    }

    if (url_hash_regex && !url_hash_regex.some(regexStr => new RegExp(regexStr).test(hash))) {
      return false
    }

    if (node_checkout_inspect && !node_checkout_inspect.some(selector => isNodeVisible(selector))) {
      return false
    }

    return true
  })
}
export const findParentNode = (nodeA, nodeB) => {
  // 边界条件检查
  if (!nodeA || !nodeB) return null;
  if (nodeA === nodeB) return nodeA;

  // 检查是否在不同文档中
  if (nodeA.ownerDocument !== nodeB.ownerDocument) {
    return null;
  }

  // 获取节点的完整祖先路径（包括Shadow边界）
  const getAncestorPath = (node) => {
    const path = [];
    let current = node;

    while (current) {
      path.push(current);

      // 处理Shadow DOM边界
      const root = current.getRootNode();
      if (root.host && root.host !== current) {
        // 当前节点在Shadow DOM中，向上到host
        current = root.host;
      } else if (current.assignedSlot) {
        // 当前节点被分配到slot中，向上到slot
        current = current.assignedSlot;
      } else if (current.parentNode) {
        // 常规DOM父节点
        current = current.parentNode;
      } else if (current === document) {
        // 到达document，下一步是window
        current = window;
      } else if (current === window) {
        // 到达window，停止
        current = null;
      } else {
        // 其他情况，停止遍历
        current = null;
      }
    }

    return path;
  };

  const pathA = getAncestorPath(nodeA);
  const pathB = getAncestorPath(nodeB);

  // 从根部开始查找最后一个相同节点
  let lca = null;
  const minLength = Math.min(pathA.length, pathB.length);

  for (let i = 1; i <= minLength; i++) {
    const ancestorA = pathA[pathA.length - i];
    const ancestorB = pathB[pathB.length - i];

    if (ancestorA === ancestorB) {
      lca = ancestorA;
    } else {
      break;
    }
  }
  

  return lca;
}