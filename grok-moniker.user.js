// ==UserScript==
// @name         Grok Moniker
// @namespace    https://github.com/Zhiro90
// @version      1.1
// @description  Adds a title management UI to Grok's Imagine carousel. Includes local storage, JSON import/export, live filtering, and sticky controls.
// @author       Zhiro90
// @match        *://grok.com/*
// @icon         https://grok.com/images/favicon.ico
// @homepageURL  https://github.com/Zhiro90/grok-moniker
// @supportURL   https://github.com/Zhiro90/grok-moniker/issues
// @downloadURL  https://raw.githubusercontent.com/Zhiro90/grok-moniker/main/grok-moniker.user.js
// @updateURL    https://raw.githubusercontent.com/Zhiro90/grok-moniker/main/grok-moniker.user.js
// @license      MIT
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = "grok_titles_v1";
    const RIGHT_WIDTH = 220; // Modificado para el lado derecho
    let titlesVisible = true; 

    function loadData() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function enhance() {
        const carousel = document.querySelector(".snap-y.snap-mandatory.flex-col");
        if (!carousel) return;

        if (!carousel.dataset.expanded) {
            carousel.dataset.expanded = "true";
            carousel.style.boxSizing = "content-box";
            if (titlesVisible) {
                // Invertido: Ahora el padding y margen negativo expanden el carrusel a la derecha
                carousel.style.paddingRight = `${RIGHT_WIDTH}px`;
                carousel.style.marginRight = `-${RIGHT_WIDTH}px`;
            }
        }

        addTopControls(carousel);

        const data = loadData();
        const activeFilter = carousel.querySelector(".grok-controls input")?.value.toLowerCase() || "";

        const buttons = Array.from(carousel.querySelectorAll("button"))
                             .filter(btn => btn.querySelector("img"));

        buttons.forEach(btn => {
            if (btn.querySelector(".grok-title-ui")) return;

            const img = btn.querySelector("img");
            if (!img) return;
            const id = img.src;

            if (activeFilter) {
                const titleText = (data[id] || "").toLowerCase();
                if (!titleText.includes(activeFilter)) {
                    btn.style.display = "none";
                }
            }

            btn.style.overflow = "visible";
            img.style.borderRadius = getComputedStyle(btn).borderRadius || "8px";

            const titleCol = document.createElement("div");
            titleCol.className = "grok-title-ui";
            titleCol.style.position = "absolute";
            // Invertido: Anclado al borde derecho del botón, colgando hacia la derecha
            titleCol.style.left = "100%";
            titleCol.style.top = "50%";
            titleCol.style.transform = "translateY(-50%)";
            titleCol.style.width = RIGHT_WIDTH + "px";
            titleCol.style.display = titlesVisible ? "flex" : "none"; 
            titleCol.style.alignItems = "center";
            // Invertido: Alineado desde el inicio del nuevo espacio
            titleCol.style.justifyContent = "flex-start";
            titleCol.style.paddingLeft = "12px";
            titleCol.style.zIndex = "100";

            titleCol.onclick = e => e.stopPropagation();
            titleCol.onmousedown = e => e.stopPropagation();

            function render() {
                titleCol.innerHTML = "";

                if (!data[id]) {
                    const plus = document.createElement("div");
                    plus.textContent = "+";
                    plus.style.cursor = "pointer";
                    plus.style.background = "#222";
                    plus.style.color = "#ddd";
                    plus.style.borderRadius = "8px";
                    plus.style.width = "36px";
                    plus.style.height = "36px";
                    plus.style.display = "flex";
                    plus.style.alignItems = "center";
                    plus.style.justifyContent = "center";
                    plus.onclick = (e) => { e.preventDefault(); e.stopPropagation(); edit(); };

                    titleCol.appendChild(plus);
                    return;
                }

                const pill = document.createElement("div");
                pill.style.display = "flex";
                pill.style.alignItems = "center";
                pill.style.gap = "8px";
                pill.style.padding = "6px 12px";
                pill.style.background = "rgba(40, 40, 40, 0.9)";
                pill.style.border = "1px solid #444";
                pill.style.borderRadius = "999px";
                pill.style.maxWidth = (RIGHT_WIDTH - 20) + "px";
                pill.style.overflow = "hidden";

                const text = document.createElement("span");
                text.textContent = data[id];
                text.style.fontWeight = "500";
                text.style.fontFamily = "system-ui, -apple-system, sans-serif";
                text.style.fontSize = "13px";
                text.style.color = "#fff";
                text.style.letterSpacing = "0.2px";
                text.style.whiteSpace = "nowrap";
                text.style.overflow = "hidden";
                text.style.textOverflow = "ellipsis";

                const editBtn = document.createElement("span");
                editBtn.textContent = "✎";
                editBtn.style.cursor = "pointer";
                editBtn.style.opacity = "0.7";
                editBtn.onmouseenter = () => editBtn.style.opacity = "1";
                editBtn.onmouseleave = () => editBtn.style.opacity = "0.7";
                editBtn.onclick = e => { e.preventDefault(); e.stopPropagation(); edit(); };

                const delBtn = document.createElement("span");
                delBtn.textContent = "✕";
                delBtn.style.cursor = "pointer";
                delBtn.style.color = "#ff6b6b";
                delBtn.style.opacity = "0.7";
                delBtn.onmouseenter = () => delBtn.style.opacity = "1";
                delBtn.onmouseleave = () => delBtn.style.opacity = "0.7";
                delBtn.onclick = e => {
                    e.preventDefault();
                    e.stopPropagation();
                    delete data[id];
                    saveData(data);
                    render();
                };

                pill.appendChild(text);
                pill.appendChild(editBtn);
                pill.appendChild(delBtn);
                titleCol.appendChild(pill);
            }

            function edit() {
                titleCol.innerHTML = "";
                const input = document.createElement("input");
                input.type = "text";
                input.value = data[id] || "";
                input.style.width = (RIGHT_WIDTH - 20) + "px";
                input.style.fontSize = "13px";
                input.style.fontWeight = "500";
                input.style.padding = "6px 10px";
                input.style.borderRadius = "8px";
                input.style.border = "1px solid #666";
                input.style.background = "#111";
                input.style.color = "#fff";
                input.style.outline = "none";

                let isSaved = false;
                function commitSave() {
                    if (isSaved) return;
                    isSaved = true;
                    const val = input.value.trim();
                    if (val) data[id] = val;
                    else delete data[id];
                    saveData(data);
                    render();
                }

                input.onkeydown = e => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                        commitSave();
                    } else if (e.key === "Escape") {
                        isSaved = true;
                        render();
                    }
                };
                
                input.onblur = commitSave;
                
                input.onclick = e => { e.preventDefault(); e.stopPropagation(); };
                titleCol.appendChild(input);
                input.focus();
            }

            render();
            btn.appendChild(titleCol);
        });
    }

    function addTopControls(carousel) {
        if (carousel.querySelector(".grok-controls")) return;

        const controls = document.createElement("div");
        controls.className = "grok-controls";
        
        controls.style.position = "sticky";
        controls.style.top = "0px";
        controls.style.zIndex = "200"; 
        controls.style.background = "rgba(10, 10, 10, 0.95)"; 
        controls.style.backdropFilter = "blur(8px)"; 
        controls.style.padding = "8px 0";
        controls.style.margin = "0";
        
        controls.style.display = "flex";
        controls.style.alignItems = "center";
        // Al usar flex-end con el layout orientado a la derecha, los controles se posicionan justo encima de la columna de títulos.
        controls.style.justifyContent = titlesVisible ? "flex-end" : "center";
        controls.style.gap = "8px";
        controls.style.width = "100%";
        controls.style.paddingRight = titlesVisible ? "4px" : "0px";

        const filterInput = document.createElement("input");
        filterInput.type = "text";
        filterInput.placeholder = "🔍 Filter...";
        filterInput.style.flexGrow = "1";
        filterInput.style.maxWidth = "130px";
        filterInput.style.background = "#222";
        filterInput.style.border = "1px solid #444";
        filterInput.style.color = "#fff";
        filterInput.style.borderRadius = "6px";
        filterInput.style.padding = "4px 8px";
        filterInput.style.fontSize = "12px";
        filterInput.style.outline = "none";
        filterInput.style.display = titlesVisible ? "block" : "none";

        filterInput.onkeydown = e => e.stopPropagation();
        filterInput.oninput = (e) => {
            e.stopPropagation();
            const term = filterInput.value.toLowerCase();
            const data = loadData();
            const buttons = Array.from(carousel.querySelectorAll("button")).filter(btn => btn.querySelector("img"));

            buttons.forEach(btn => {
                const img = btn.querySelector("img");
                if (!img) return;
                const title = (data[img.src] || "").toLowerCase();
                if (term === "" || title.includes(term)) {
                    btn.style.display = "";
                } else {
                    btn.style.display = "none";
                }
            });
        };

        const importBtn = document.createElement("button");
        importBtn.innerHTML = "📥";
        importBtn.title = "Import data (JSON)";
        importBtn.style.fontSize = "16px";
        importBtn.style.background = "transparent";
        importBtn.style.border = "none";
        importBtn.style.cursor = "pointer";
        importBtn.style.opacity = "0.6";
        importBtn.style.display = titlesVisible ? "inline-block" : "none"; 
        importBtn.onmouseenter = () => importBtn.style.opacity = "1";
        importBtn.onmouseleave = () => importBtn.style.opacity = "0.6";
        importBtn.onclick = () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'application/json';
            fileInput.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    try {
                        JSON.parse(ev.target.result); 
                        localStorage.setItem(STORAGE_KEY, ev.target.result);
                        alert("Titles imported successfully! The page will reload to apply changes.");
                        location.reload();
                    } catch (err) {
                        alert("Error: The file is not a valid JSON.");
                    }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        };

        const exportBtn = document.createElement("button");
        exportBtn.innerHTML = "📤";
        exportBtn.title = "Export data (JSON)";
        exportBtn.style.fontSize = "16px";
        exportBtn.style.background = "transparent";
        exportBtn.style.border = "none";
        exportBtn.style.cursor = "pointer";
        exportBtn.style.opacity = "0.6";
        exportBtn.style.display = titlesVisible ? "inline-block" : "none"; 
        exportBtn.onmouseenter = () => exportBtn.style.opacity = "1";
        exportBtn.onmouseleave = () => exportBtn.style.opacity = "0.6";
        exportBtn.onclick = () => {
            const dataStr = localStorage.getItem(STORAGE_KEY) || "{}";
            const blob = new Blob([dataStr], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `grok_titles_${date}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };

        const toggleBtn = document.createElement("button");
        toggleBtn.innerHTML = titlesVisible ? "👁️" : "🙈";
        toggleBtn.title = "Toggle titles visibility";
        toggleBtn.style.fontSize = "16px";
        toggleBtn.style.background = "transparent";
        toggleBtn.style.border = "none";
        toggleBtn.style.cursor = "pointer";
        toggleBtn.style.opacity = titlesVisible ? "0.6" : "1";
        toggleBtn.onmouseenter = () => toggleBtn.style.opacity = "1";
        toggleBtn.onmouseleave = () => toggleBtn.style.opacity = titlesVisible ? "0.6" : "1";
        toggleBtn.onclick = () => {
            titlesVisible = !titlesVisible;
            toggleBtn.innerHTML = titlesVisible ? "👁️" : "🙈";
            if (titlesVisible) {
                toggleBtn.style.opacity = "0.6";
                // Invertido: Restaurar padding derecho
                carousel.style.paddingRight = `${RIGHT_WIDTH}px`;
                carousel.style.marginRight = `-${RIGHT_WIDTH}px`;
                carousel.querySelectorAll('.grok-title-ui').forEach(el => el.style.display = 'flex');
                
                filterInput.style.display = "block";
                importBtn.style.display = "inline-block";
                exportBtn.style.display = "inline-block";
                controls.style.justifyContent = "flex-end";
                controls.style.paddingRight = "4px";
            } else {
                toggleBtn.style.opacity = "1";
                // Invertido: Colapsar padding derecho
                carousel.style.paddingRight = `0px`;
                carousel.style.marginRight = `0px`;
                carousel.querySelectorAll('.grok-title-ui').forEach(el => el.style.display = 'none');
                
                filterInput.style.display = "none";
                importBtn.style.display = "none";
                exportBtn.style.display = "none";
                controls.style.justifyContent = "center";
                controls.style.paddingRight = "0px";
            }
        };

        controls.appendChild(filterInput);
        controls.appendChild(toggleBtn);
        controls.appendChild(importBtn);
        controls.appendChild(exportBtn);

        carousel.insertBefore(controls, carousel.firstChild);
    }

    const observer = new MutationObserver(() => {
        observer.disconnect();
        enhance();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    enhance();

})();