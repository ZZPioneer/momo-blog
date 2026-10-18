/*!
 * Live2D Widget autoload — 本地内置版
 * 基于 live2d-widgets (https://github.com/stevenjoezhang/live2d-widget, GPLv3)
 * 所有运行库与模型均从本站 /live2d/ 目录加载，不依赖外部 CDN。
 */
(function () {
  "use strict";

  var live2d_path = "/live2d/";

  // 移动端（窄屏）不加载看板娘，避免占用带宽与遮挡内容
  if (typeof screen !== "undefined" && screen.width < 768) return;

  // 用户主动退出后不再自动加载
  try {
    if (localStorage.getItem("waifu-disabled") === "true") return;
  } catch (error) {
    // 隐私模式下 localStorage 可能不可用，忽略即可
  }

  function loadResource(url, type) {
    return new Promise(function (resolve) {
      var element;
      if (type === "css") {
        element = document.createElement("link");
        element.rel = "stylesheet";
        element.href = url;
      } else {
        element = document.createElement("script");
        element.src = url;
        if (type === "module") element.type = "module";
      }
      element.onload = function () {
        resolve(url);
      };
      element.onerror = function () {
        resolve(url);
      };
      document.head.appendChild(element);
    });
  }

  // 允许沿页面底部水平拖动看板娘：位置锁定在底边，只改变左右位置，并记住上次的位置
  function enableBottomDrag() {
    var waifu = document.getElementById("waifu");
    var canvas = document.getElementById("live2d");
    if (!waifu || !canvas) return;

    function maxLeft() {
      return Math.max(0, window.innerWidth - waifu.offsetWidth);
    }
    function currentLeft() {
      return waifu.getBoundingClientRect().left;
    }

    try {
      var saved = parseFloat(localStorage.getItem("waifu-left"));
      if (!isNaN(saved))
        waifu.style.left = Math.min(maxLeft(), Math.max(0, saved)) + "px";
    } catch (error) {
      // 忽略存储不可用的情况
    }

    var dragging = false;
    var startX = 0;
    var startLeft = 0;

    canvas.addEventListener("mousedown", function (event) {
      if (event.button !== 0) return;
      dragging = true;
      startX = event.clientX;
      startLeft = currentLeft();
      document.body.style.userSelect = "none";
      event.preventDefault();
    });
    document.addEventListener("mousemove", function (event) {
      if (!dragging) return;
      var next = startLeft + (event.clientX - startX);
      next = Math.min(maxLeft(), Math.max(0, next));
      waifu.style.left = next + "px";
    });
    function stopDrag() {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = "";
      try {
        localStorage.setItem("waifu-left", String(Math.round(currentLeft())));
      } catch (error) {
        // 忽略存储不可用的情况
      }
    }
    document.addEventListener("mouseup", stopDrag);
    window.addEventListener("blur", stopDrag);
    window.addEventListener("resize", function () {
      var max = maxLeft();
      if (currentLeft() > max) waifu.style.left = max + "px";
    });
  }

  Promise.all([
    loadResource(live2d_path + "waifu.css", "css"),
    loadResource(live2d_path + "waifu-tips.js", "module"),
  ]).then(function () {
    if (typeof window.initWidget !== "function") return;
    window.initWidget({
      waifuPath: live2d_path + "waifu-tips.json",
      cdnPath: live2d_path,
      cubism2Path: live2d_path + "live2d.min.js",
      modelId: 0,
      tools: ["switch-model", "photo", "info", "quit"],
      drag: false,
      logLevel: "warn",
    });
    // 看板娘 DOM 是初始化后异步插入的，轮询等待 #waifu / #live2d 出现后再启用拖动
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (document.getElementById("waifu") && document.getElementById("live2d")) {
        clearInterval(timer);
        enableBottomDrag();
      } else if (tries >= 60) {
        clearInterval(timer);
      }
    }, 250);
  });
})();
