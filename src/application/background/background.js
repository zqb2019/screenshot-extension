console.log('background.js')
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'DOWNLOAD_IMAGE') {
    chrome.downloads.download({
      url: message.imageData,
      filename: message.filename,
      conflictAction: 'overwrite'
    });
  }
})