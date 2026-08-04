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
      "IBC-6S": { note: "标准通用型，适合轻中比重液体与 1+1 堆码。", bct: "17.2t", stack: "1+1" },
      "IBC-6P": { note: "旗舰重载型，梯度湿压内纸，适合 1.2~1.4 比重液体。", bct: "20.2t", stack: "1+2" },
      "IBC-7S": { note: "中重载型，7 层 36mm 壁厚，梯度湿压内纸，适合高比重液体与非液散货。", bct: "23.5t", stack: "1+1" },
      "IBC-8MAX": { note: "极限特重型，8 层 90# 美卡结构，适合高比重、高堆码。", bct: "26.5t", stack: "1+3" },
    };

    const update = () => {
      const density = Number(densityInput.value) || 1;
      const volume = Number(volumeInput.value) || 1000;
      const stack = Number(stackInput.value) || 1;
      let model = "IBC-8MAX";
      if (density <= 1.1 && stack <= 2) model = "IBC-6S";
      else if (density <= 1.4 && stack <= 3) model = "IBC-6P";
      else if (density <= 1.45 && stack <= 2) model = "IBC-7S";
      const spec = specs[model];
      const gross = Math.round(volume * density + 60);
      const total = exportInput.checked ? 20000 : gross * stack;
      modelEl.textContent = model;
      modelNoteEl.textContent = spec.note;
      weightEl.textContent = `${gross.toLocaleString()} kg`;
      loadEl.textContent = spec.bct;
      stackEl.textContent = stack > 4 ? "超限" : `${1}+${Math.min(stack, 3)}`;
      if (stackOutput) stackOutput.textContent = `${stack} 层`;
    };

    [densityInput, volumeInput, stackInput, exportInput].forEach((input) => {
      if (input) input.addEventListener("input", update);
    });
    update();
  }

  const resourcePage = $("[data-resource-page]");
  if (resourcePage && window.RESOURCES) {
    const list = $("[data-resource-list]", resourcePage);
    const countEl = $("[data-resource-count]", resourcePage);
    const searchInput = $("[data-resource-search]", resourcePage);
    const filterWrap = $("[data-resource-filters]", resourcePage);
    let activeCategory = "全部";

    const typeOf = (resource) => {
      const ext = resource.path.split(".").pop().toLowerCase();
      if (["mp4", "webm", "mov", "avi"].includes(ext)) return "视频";
      if (["pdf"].includes(ext)) return "PDF";
      if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "图片";
      if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "文档";
      if (["sldprt", "sldasm", "stp", "step", "dwg", "dxf"].includes(ext)) return "CAD";
      if (["html", "htm"].includes(ext)) return "网页";
      return "文件";
    };

    const humanSize = (bytes) => {
      if (!bytes) return "";
      const units = ["B", "KB", "MB", "GB"];
      let index = 0;
      let value = bytes;
      while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
      }
      return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
    };

    const resourceHref = (path) => {
      return `../${path.split("/").map((part) => encodeURIComponent(part)).join("/")}`;
    };

    const categories = [...new Set(window.RESOURCES.map((item) => item.category))].sort();
    const categoryParam = new URLSearchParams(window.location.search).get("category");
    if (categoryParam && categories.includes(categoryParam)) {
      activeCategory = categoryParam;
    }
    const chips = [
      { label: "全部", value: "全部" },
      ...categories.map((category) => ({ label: category, value: category })),
    ];

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

    const render = () => {
      const query = (searchInput.value || "").trim().toLowerCase();
      const rows = window.RESOURCES.filter((resource) => {
        const categoryMatch = activeCategory === "全部" || resource.category === activeCategory;
        const haystack = `${resource.name} ${resource.note || ""} ${resource.source || ""} ${resource.path}`.toLowerCase();
        return categoryMatch && (!query || haystack.includes(query));
      });
      countEl.textContent = `共 ${rows.length} 项资料`;
      list.innerHTML = "";

      if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "resource-empty";
        empty.textContent = "没有匹配的资料，请调整关键词或分类。";
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
            <div class="resource-meta">${resource.note || ""}${resource.source ? ` · ${resource.source}` : ""}</div>
          </div>
          <div class="resource-meta">${resource.category || "其他"}</div>
          <div><span class="resource-type resource-type--${type === "视频" ? "video" : type === "PDF" ? "pdf" : type === "图片" ? "image" : "file"}">${type}</span></div>
          <div class="resource-row-actions">
            <span class="resource-meta">${humanSize(resource.size)}</span>
            <a href="${resourceHref(resource.path)}" target="_blank" rel="noopener">打开</a>
          </div>
        `;
        list.appendChild(row);
      });
    };

    searchInput.addEventListener("input", render);
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
