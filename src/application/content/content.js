import html2canvas from 'html2canvas';
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_AREA') {
    captureArea(request.config).then(result => {
      sendResponse({success: true, image: result});
    }).catch(error => {
      console.error('截图失败:', error);
      sendResponse({success: false});
    });
    
    return true; // 保持消息端口开放
  }
});

async function captureArea(config) {
  // 使用html2canvas或其他截图库
  const element = document.querySelector(config.ContainersNode);
  
  if (!element) {
    throw new Error('找不到指定的DOM元素');
  }
  
  const canvas = await html2canvas(element, {
    logging: false,
    useCORS: true,
    ...config.options
  });
  
  return canvas.toDataURL('image/png');
}