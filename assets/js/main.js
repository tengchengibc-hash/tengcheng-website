(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const copyright = $("[data-year]");
  if (copyright) copyright.textContent = new Date().getFullYear();

  const menuToggle = $("[data-menu-toggle]");
  const mobileNav = $("[data-mobile-nav]");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    $$("a", mobileNav).forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  const tabLists = $$("[data-tabs]");
  tabLists.forEach((list) => {
    const panels = $$("[data-panel]");
    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tab]");
      if (!button) return;
      const group = button.dataset.tabGroup;
      $$("[data-tab]", list).forEach((tab) => {
        tab.setAttribute("aria-selected", String(tab === button));
      });
      panels.forEach((panel) => {
        panel.setAttribute("data-active", String(panel.dataset.panel === group));
      });
    });
  });

  const selectForm = $("[data-selector-form]");
  if (selectForm) {
    const densityInput = $("[data-field='density']", selectForm);
    const volumeInput = $("[data-field='volume']", selectForm);
    const stackInput = $("[data-field='stack']", selectForm);
    const exportInput = $("[data-field='export']", selectForm);
    const modelEl = $("[data-result-model]", selectForm);
    const modelNoteEl = $("[data-result-note]", selectForm);
    const weightEl = $("[data-result-weight]", selectForm);
    const loadEl = $("[data-result-load]", selectForm);
    const stackEl = $("[data-result-stack]", selectForm);
    const stackOutput = $("[data-stack-output]", selectForm);

    const specs = {
      "IBC-7P": { note: "标准型，7 层 36mm 壁厚，适合比重 ≤1.0 的液体与散货。", bct: "详询" },
      "IBC-8P": { note: "重载型，8 层 41mm 壁厚，适合比重 1.0~1.2 的液体。", bct: "详询" },
      "IBC-9P": { note: "特重型，9 层 46mm 壁厚，适合比重 1.2~1.4 的液体。", bct: "详询" },
    };

    const update = () => {
      const density = Number(densityInput.value) || 1;
      const volume = Number(volumeInput.value) || 1000;
      const stack = Number(stackInput.value) || 1;
      // 按推荐液体比重区间选型（用户 2026-11-01 确认的 3 型号体系）
      let model = "IBC-9P";
      if (density <= 1.0) model = "IBC-7P";
      else if (density <= 1.2) model = "IBC-8P";
      const overDensity = density > 1.4;
      const spec = specs[model];
      const gross = Math.round(volume * density + 60);
      const total = exportInput.checked ? 20000 : gross * stack;
      modelEl.textContent = overDensity ? "超出选型范围" : model;
      modelNoteEl.textContent = overDensity
        ? "比重超过 1.4 g/cm³，请直接联系工程团队核定。"
        : spec.note;
      weightEl.textContent = `${gross.toLocaleString()} kg`;
      loadEl.textContent = spec.bct;
      stackEl.textContent = "详询";
      if (stackOutput) stackOutput.textContent = `${stack} 层`;
    };

    [densityInput, volumeInput, stackInput, exportInput].forEach((input) => {
      if (input) input.addEventListener("input", update);
    });
    update();
  }

  /*
   * 资料中心
   * 说明：
   *  1) size 字段统一存「字节数」，由 humanSize() 换算成 KB/MB；
   *  2) 链接前缀按页面所在目录动态计算，中文站用 "assets/…"，英文站（en/）用 "../assets/…"；
   *  3) 界面文案按 <html lang> 自动切换中英文；
   *  4) 计数、搜索框、筛选容器均可缺省，缺失时对应功能静默跳过，不抛异常。
   */
  const resourcePage = $("[data-resource-page]");
  if (resourcePage && window.RESOURCES) {
    const ALL_CATEGORY = "__ALL__";
    const isEn = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
    const T = isEn
      ? { all: "All", items: "items", open: "Open", empty: "No matching resources. Try another keyword or category.",
          video: "Video", pdf: "PDF", image: "Image", doc: "Document", web: "Web", file: "File",
          meta: (r) => [r.note || "", r.category || ""].filter(Boolean).join(" · ") }
      : { all: "全部", items: "项资料", open: "打开", empty: "没有匹配的资料，请调整关键词或分类。",
          video: "视频", pdf: "PDF", image: "图片", doc: "文档", web: "网页", file: "文件",
          meta: (r) => `${r.note || ""}${r.source ? ` · ${r.source}` : ""}` };

    const list = $("[data-resource-list]", resourcePage);
    const countEl = $("[data-resource-count]", resourcePage);
    const searchInput = $("[data-resource-search]", resourcePage);
    const filterWrap = $("[data-resource-filters]", resourcePage);
    let activeCategory = ALL_CATEGORY;

    // 站点根相对前缀：中文页（html 在站点根）为 ""，英文页（html 在 en/）为 "../"
    const depth = document.querySelectorAll('script[src$="main.js"]')[0];
    let relPrefix = "";
    if (depth && depth.getAttribute("src")) {
      relPrefix = depth.getAttribute("src").replace(/assets\/js\/main\.js$/, "");
    }

    const typeOf = (resource) => {
      const ext = resource.path.split(".").pop().toLowerCase();
      if (["mp4", "webm", "mov", "avi"].includes(ext)) return T.video;
      if (["pdf"].includes(ext)) return T.pdf;
      if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return T.image;
      if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return T.doc;
      if (["html", "htm"].includes(ext)) return T.web;
      return T.file;
    };

    // 输入为字节数；留空返回空串
    const humanSize = (bytes) => {
      if (!bytes) return "";
      const units = ["B", "KB", "MB", "GB"];
      let index = 0;
      let value = Number(bytes);
      while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
      }
      return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
    };

    const resourceHref = (path) => {
      return `${relPrefix}${path.split("/").map((part) => encodeURIComponent(part)).join("/")}`;
    };

    const categories = [...new Set(window.RESOURCES.map((item) => item.category))].sort();
    const categoryParam = new URLSearchParams(window.location.search).get("category");
    if (categoryParam && categories.includes(categoryParam)) {
      activeCategory = categoryParam;
    }
    const chips = [
      { label: T.all, value: ALL_CATEGORY },
      ...categories.map((category) => ({ label: category, value: category })),
    ];

    if (filterWrap) {
      chips.forEach((chip) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-chip";
        button.textContent = chip.label;
        button.dataset.category = chip.value;
        button.setAttribute("aria-pressed", String(chip.value === activeCategory));
        button.addEventListener("click", () => {
          activeCategory = chip.value;
          $$(".filter-chip", filterWrap).forEach((el) => {
            el.setAttribute("aria-pressed", String(el.dataset.category === activeCategory));
          });
          render();
        });
        filterWrap.appendChild(button);
      });
    }

    function render() {
      if (!list) return;
      const query = searchInput ? (searchInput.value || "").trim().toLowerCase() : "";
      const rows = window.RESOURCES.filter((resource) => {
        const categoryMatch = activeCategory === ALL_CATEGORY || resource.category === activeCategory;
        const haystack = `${resource.name} ${resource.note || ""} ${resource.source || ""} ${resource.path}`.toLowerCase();
        return categoryMatch && (!query || haystack.includes(query));
      });
      if (countEl) {
        countEl.textContent = isEn ? `${rows.length} ${T.items}` : `共 ${rows.length} ${T.items}`;
      }
      list.innerHTML = "";

      if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "resource-empty";
        empty.textContent = T.empty;
        list.appendChild(empty);
        return;
      }

      rows.forEach((resource) => {
        const type = resource.type || typeOf(resource);
        const row = document.createElement("div");
        row.className = "resource-row";
        row.innerHTML = `
          <div>
            <a href="${resourceHref(resource.path)}" target="_blank" rel="noopener">${resource.name}</a>
            <div class="resource-meta">${T.meta(resource)}</div>
          </div>
          <div class="resource-meta">${resource.category || (isEn ? "Other" : "其他")}</div>
          <div><span class="resource-type resource-type--${type === T.video ? "video" : type === T.pdf ? "pdf" : type === T.image ? "image" : "file"}">${type}</span></div>
          <div class="resource-row-actions">
            <span class="resource-meta">${humanSize(resource.size)}</span>
            <a href="${resourceHref(resource.path)}" target="_blank" rel="noopener">${T.open}</a>
          </div>
        `;
        list.appendChild(row);
      });
    }

    if (searchInput) searchInput.addEventListener("input", render);
    render();
  }

  const contactForm = $("[data-contact-form]");
  const contactStatus = $("[data-contact-status]");
  if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const company = $("#contact-company", contactForm).value.trim() || "未填写";
      const email = $("#contact-email", contactForm).value.trim() || "未填写";
      const product = $("#contact-product", contactForm).value;
      const message = $("#contact-message", contactForm).value.trim() || "未填写";
      const subject = encodeURIComponent(`MOLEI 摩垒产品咨询 - ${company}`);
      const body = encodeURIComponent(`公司/姓名：${company}\n联系邮箱：${email}\n关注产品：${product}\n需求：${message}`);
      contactStatus.textContent = "已打开邮件客户端，请发送以完成提交。";
      window.location.href = `mailto:info@molei-packaging.com?subject=${subject}&body=${body}`;
    });
  }
})();
