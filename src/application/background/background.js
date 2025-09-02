chrome.runtime.onMessage.addListener(request=>{
  const { type, data } = request
  if (type === 'changeDevice') {
    console.log('changeDevice',data)
    data.device === "mobile" ? switchMobileView () : resetDesktopView()
  }
})
function getDeviceParams(deviceType) {
    const devices = {
        iphone: {
            width: 390,
            height: 844,
            deviceScaleFactor: 1,
            mobile: true,
            touch: true,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        },
        samsung: {
            width: 360,
            height: 800,
            deviceScaleFactor: 1,
            mobile: true,
            touch: true,
            userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36'
        }
    };
    
    return devices[deviceType] || devices.samsung;
}

function switchMobileView(deviceType) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log('switchMobileView', tabs)
        if (tabs.length === 0) return;
        
        const tabId = tabs[0].id;
        const device = getDeviceParams(deviceType);
        applyMobileView("iphone12", tabId)
        // 附加调试器并发送命令
        // chrome.debugger.attach({ tabId }, "1.3", function() {
        //     if (chrome.runtime.lastError) {
        //         console.error(chrome.runtime.lastError);
        //         return;
        //     }
            
        //     // 设置设备参数
        //     chrome.debugger.sendCommand(
        //         { tabId },
        //         "Emulation.setDeviceMetricsOverride",
        //         {
        //             width: device.width,
        //             height: device.height,
        //             deviceScaleFactor: device.deviceScaleFactor,
        //             mobile: true,
        //             screenWidth: device.width,
        //             screenHeight: device.height,
        //             viewport: {
        //                 x: 0,
        //                 y: 0,
        //                 width: device.width,
        //                 height: device.height,
        //                 scale: 1
        //             }
        //         }
        //     );
            
        //     // 设置用户代理
        //     chrome.debugger.sendCommand(
        //         { tabId },
        //         "Emulation.setUserAgentOverride",
        //         { 
        //           userAgent: device.userAgent,
        //           platform: device.mobile ? 'iPhone' : ''
        //         }
        //     );
        // });
    });
}
function resetDesktopView() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log('resetDesktopView', tabs)
        if (tabs.length === 0) return;
        const tabId = tabs[0].id;
        chrome.debugger.detach({ tabId });
        chrome.debugger.attach({ tabId }, "1.3", function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }
            // 清除设备参数覆盖
            chrome.debugger.sendCommand(
                { tabId },
                "Emulation.clearDeviceMetricsOverride"
            );
            
            // 分离调试器
            chrome.debugger.detach({ tabId });
        });
    });
}


const DEVICE_PRESETS = {
    iphone12: {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        mobile: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        name: 'iPhone 12',
        touch: true,
        screenOrientation: { angle: 0, type: 'portraitPrimary' },
        viewportMeta: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    },
    samsung: {
        width: 360,
        height: 800,
        deviceScaleFactor: 3,
        mobile: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36',
        name: 'Samsung Galaxy S21',
        touch: true,
        screenOrientation: { angle: 0, type: 'portraitPrimary' },
        viewportMeta: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    }
};

// 应用移动端视图（修复滚动和白屏问题）
async function applyMobileView(deviceType, currentTabId) {
    if (!currentTabId) {
        showStatus('无法获取当前标签页', 'error');
        return;
    }

    const device = DEVICE_PRESETS[deviceType];
    if (!device) {
        showStatus('未知设备类型', 'error');
        return;
    }

    try {
        // 附加调试器
        await chrome.debugger.attach({ tabId: currentTabId}, "1.3");
        
        // 1. 首先注入视口meta标签（关键！解决白屏和滚动问题）
        await injectViewportMeta(currentTabId, device.viewportMeta);

        // 2. 设置设备指标（修正视口高度计算）
        await chrome.debugger.sendCommand(
            { tabId: currentTabId },
            "Emulation.setDeviceMetricsOverride",
            {
                width: device.width,
                height: device.height,
                deviceScaleFactor: device.deviceScaleFactor,
                mobile: device.mobile,
                // 关键修正：屏幕尺寸和视口尺寸分开设置
                screenWidth: device.width,
                screenHeight: device.height,
                viewport: {
                    x: 0,
                    y: 0,
                    width: device.width,
                    height: device.height, // 使用完整高度，不裁剪
                    scale: 1
                }
            }
        );

        // 3. 设置用户代理
        await chrome.debugger.sendCommand(
            { tabId: currentTabId },
            "Emulation.setUserAgentOverride",
            { 
                userAgent: device.userAgent,
                platform: device.mobile ? 'iPhone' : ''
            }
        );

        // 4. 启用触摸模拟
        await chrome.debugger.sendCommand(
            { tabId: currentTabId },
            "Emulation.setTouchEmulationEnabled",
            {
                enabled: true,
                configuration: device.touch ? 'mobile' : 'desktop'
            }
        );

        // 5. 修复CSS滚动问题
        await fixScrollIssues(currentTabId);

        // 6. 强制重布局（解决白屏问题）
        await forceRelayout(currentTabId);

    } catch (error) {
        console.error('应用移动视图失败:', error);
    }
}

// 注入视口meta标签（关键步骤）
async function injectViewportMeta(tabId, viewportContent) {
    try {
        await chrome.debugger.sendCommand(
            { tabId: tabId },
            "Runtime.evaluate",
            {
                expression: `
                    (function() {
                        // 移除现有的viewport meta
                        var existingMeta = document.querySelector('meta[name="viewport"]');
                        if (existingMeta) {
                            existingMeta.remove();
                        }
                        
                        // 创建新的viewport meta
                        var meta = document.createElement('meta');
                        meta.name = 'viewport';
                        meta.content = '${viewportContent}';
                        
                        // 添加到head
                        var head = document.head || document.getElementsByTagName('head')[0];
                        if (head) {
                            head.appendChild(meta);
                            return true;
                        }
                        return false;
                    })()
                `,
                userGesture: true,
                awaitPromise: true
            }
        );
    } catch (error) {
        console.warn('注入viewport meta失败:', error);
    }
}

// 修复CSS滚动问题
async function fixScrollIssues(tabId) {
    try {
        await chrome.debugger.sendCommand(
            { tabId: tabId },
            "Runtime.evaluate",
            {
                expression: `
                    (function() {
                        // 修复body和html的滚动
                        document.documentElement.style.overflow = 'auto';
                        document.documentElement.style.height = '100%';
                        document.body.style.overflow = 'auto';
                        document.body.style.height = '100%';
                        document.body.style.position = 'relative';
                        
                        // 移除可能阻止滚动的样式
                        document.documentElement.style.overscrollBehavior = 'auto';
                        document.body.style.overscrollBehavior = 'auto';
                        
                        // 确保所有滚动容器都能滚动
                        var elements = document.querySelectorAll('*');
                        for (var i = 0; i < elements.length; i++) {
                            var element = elements[i];
                            var style = window.getComputedStyle(element);
                            if (style.overflow === 'hidden' || style.overflowY === 'hidden') {
                                element.style.overflowY = 'auto';
                            }
                        }
                        
                        return true;
                    })()
                `,
                userGesture: true,
                awaitPromise: true
            }
        );
    } catch (error) {
        console.warn('修复滚动问题失败:', error);
    }
}

// 强制重布局（解决白屏问题）
async function forceRelayout(tabId) {
    try {
        // 多次触发重布局确保生效
        for (let i = 0; i < 3; i++) {
            await chrome.debugger.sendCommand(
                { tabId: tabId },
                "Runtime.evaluate",
                {
                    expression: `
                        (function() {
                            // 触发重布局
                            void document.body.offsetHeight;
                            window.dispatchEvent(new Event('resize'));
                            window.dispatchEvent(new Event('orientationchange'));
                            return true;
                        })()
                    `,
                    userGesture: true
                }
            );
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (error) {
        console.warn('强制重布局失败:', error);
    }
}
async function enhanceScrollFix(tabId) {
    try {
        await chrome.debugger.sendCommand(
            { tabId: tabId },
            "Runtime.evaluate",
            {
                expression: `
                    (function() {
                        // 1. 修复滚动容器
                        var style = document.createElement('style');
                        style.textContent = '
                            html, body { 
                                -webkit-overflow-scrolling: touch !important; 
                                overflow: auto !important; 
                                height: 100% !important; 
                                position: relative !important;
                            }
                            body > * {
                                min-height: 100vh !important;
                            }
                        ';
                        document.head.appendChild(style);
                        
                        // 2. 禁用可能阻止滚动的事件
                        document.addEventListener('touchmove', function(e) {
                            if (e.touches.length > 1) {
                                e.preventDefault();
                            }
                        }, { passive: false });
                        
                        // 3. 确保所有滚动元素都能工作
                        var scrollableElements = document.querySelectorAll(
                            'div, section, article, main, aside'
                        );
                        
                        scrollableElements.forEach(function(el) {
                            var computedStyle = window.getComputedStyle(el);
                            if (computedStyle.overflowY === 'scroll' || 
                                computedStyle.overflowY === 'auto') {
                                el.style.webkitOverflowScrolling = 'touch';
                            }
                        });
                        
                        return true;
                    })()
                `,
                userGesture: true,
                awaitPromise: true
            }
        );
    } catch (error) {
        console.warn('增强滚动修复失败:', error);
    }
}
