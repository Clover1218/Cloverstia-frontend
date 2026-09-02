// Bookshelf.js —— 书架（白模黑线正交描边风格）
// 架构与 Laptop.js / Chair.js 一致：继承 THREE.Group，提供 hitTest / update / dispose / getInfo
import * as THREE from 'three';

// ---- 全局共用材质（与其它对象保持一致） ----
const MAT = new THREE.LineBasicMaterial({ color: 0x000000 });
const FILL = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2
});

function box(w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, FILL);
    const line = new THREE.LineSegments(new THREE.EdgesGeometry(geo), MAT);
    const group = new THREE.Group();
    group.add(mesh, line);
    return group;
}

// ---- Bookshelf 类 ----
export class Bookshelf extends THREE.Group {
    /**
     * @param {Object} config
     * @param {number} config.width      - 书架宽度 (X轴)
     * @param {number} config.height     - 书架高度 (Y轴)
     * @param {number} config.depth      - 书架深度 (Z轴)
     * @param {number} config.thickness  - 侧板/隔板厚度
     * @param {number} config.boardCount - 隔板数量（层数 = boardCount + 1）
     */
    constructor(config = {}) {
        super();

        // 保存参数
        this.width = config.width ?? 2;
        this.height = config.height ?? 5;
        this.depth = config.depth ?? 1.5;
        this.thickness = config.thickness ?? 0.1;
        this.boardCount = config.boardCount ?? 4;

        // 构建模型 + 点击代理
        this._buildModel();
        this._addProxy();
    }

    // ---------- 构建模型 ----------
    _buildModel() {
        const { width, height, depth, thickness, boardCount } = this;

        // 两侧板
        const sideA = box(thickness, height, depth);
        sideA.position.set(-width / 2, height / 2, 0);
        this.add(sideA);

        const sideB = box(thickness, height, depth);
        sideB.position.set(width / 2, height / 2, 0);
        this.add(sideB);

        // 隔板（均匀分布）
        for (let i = 0; i < boardCount; i++) {
            const y = ((i + 1) * height) / (boardCount + 1);
            const board = box(width, thickness, depth);
            board.position.set(0, y, 0);
            this.add(board);
        }
    }

    // ---------- 交互代理（不可见，用于射线检测） ----------
    _addProxy() {
        const proxy = new THREE.Mesh(
            new THREE.BoxGeometry(this.width + 0.4, this.height + 0.4, this.depth + 0.4),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        proxy.position.y = this.height / 2;
        this.add(proxy);
        this._proxy = proxy;
    }

    // ---------- 命中检测 ----------
    hitTest(clientX, clientY, camera) {
        if (!this._proxy) return false;
        const mouse = new THREE.Vector2(
            (clientX / window.innerWidth) * 2 - 1,
            -(clientY / window.innerHeight) * 2 + 1
        );
        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);
        return ray.intersectObject(this._proxy).length > 0;
    }

    // ---------- 信息展示（外部点击时调用） ----------
    getInfo() {
        return {
            name: '书架',
            description: '开放式书架，多层收纳，可摆放书籍与摆件。',
            properties: [
                { label: '尺寸', value: `${this.width} × ${this.height} × ${this.depth}` },
                { label: '层数', value: `${this.boardCount + 1} 层` },
                { label: '隔板', value: `${this.boardCount} 块` },
                { label: '位置', value: this._posText() }
            ]
        };
    }

    _posText() {
        const p = this.position;
        return `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`;
    }

    // ---------- 更新循环（静态物体，默认无操作） ----------
    update() {}

    // ---------- 资源清理 ----------
    dispose() {
        this.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
    }
}
