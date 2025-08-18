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