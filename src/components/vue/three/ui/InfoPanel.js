// InfoPanel.js —— 全局信息展示部件（DOM 覆盖层）
// 点击场景中的物体时，把该物体的 getInfo() 结果展示在这里
// 风格与 3D 场景一致：白底 + 黑色描边 + 硬偏移阴影（正交感）

export class InfoPanel {
    constructor() {
        // 根容器：固定定位、不拦截鼠标事件
        this._el = document.createElement('div');
        this._el.style.cssText = [
            'position: fixed',
            'top: 16px',
            'left: 16px',
            'z-index: 10',
            'pointer-events: none',
            'background: #ffffff',
            'border: 1px solid #000',
            'padding: 14px 16px 10px',
            'min-width: 220px',
            'max-width: 280px',
            'box-sizing: border-box',
            'font-family: "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif',
            'color: #000',
            'box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.25)',
            'display: none'
        ].join(';') + ';';

        // 标题（名称）
        this._titleEl = document.createElement('div');
        this._titleEl.style.cssText = 'font-size: 16px; font-weight: 700; margin-bottom: 6px;';

        // 描述
        this._descEl = document.createElement('div');
        this._descEl.style.cssText = 'font-size: 12px; line-height: 1.6; margin-bottom: 8px; color: #333;';

        // 属性列表（label: value 行）
        this._propsEl = document.createElement('div');
        this._propsEl.style.cssText = 'font-size: 12px;';

        // 可选链接（如点击桌子跳转主页）
        this._linkEl = document.createElement('a');
        this._linkEl.style.cssText = 'display: inline-block; margin-top: 10px; font-size: 12px; color: #000; text-decoration: underline; pointer-events: auto; cursor: pointer;';

        this._el.append(this._titleEl, this._descEl, this._propsEl, this._linkEl);
        document.body.appendChild(this._el);
    }

    /**
     * 展示信息
     * @param {{name?: string, description?: string, properties?: {label: string, value: string|number}[], link?: {href: string, text: string}}} info
     */
    show(info) {
        if (!info) return this.hide();

        this._titleEl.textContent = info.name || '';
        this._descEl.textContent = info.description || '';

        // 清空并重建属性行
        this._propsEl.innerHTML = '';
        (info.properties || []).forEach(({ label, value }) => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; justify-content: space-between; gap: 12px; padding: 3px 0; border-bottom: 1px solid #ddd;';

            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'color: #666;';

            const valueEl = document.createElement('span');
            valueEl.textContent = String(value);
            valueEl.style.cssText = 'font-weight: 600; text-align: right;';

            row.append(labelEl, valueEl);
            this._propsEl.appendChild(row);
        });

        // 链接：有则显示，无则隐藏
        if (info.link) {
            this._linkEl.href = info.link.href;
            this._linkEl.textContent = info.link.text || info.link.href;
            this._linkEl.target = '_blank';
            this._linkEl.rel = 'noopener';
            this._linkEl.style.display = 'inline-block';
        } else {
            this._linkEl.style.display = 'none';
            this._linkEl.removeAttribute('href');
        }

        this._el.style.display = 'block';
    }

    /** 隐藏信息面板 */
    hide() {
        this._el.style.display = 'none';
    }

    /** 资源清理：从 DOM 中移除 */
    dispose() {
        this._el.remove();
    }
}
