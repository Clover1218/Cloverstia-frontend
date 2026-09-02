// Desk.js —— 书桌（白模黑线正交描边风格）
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

// ---- Desk 类 ----
export class Desk extends THREE.Group {
    /**
     * @param {Object} config
     * @param {number} config.width     - 桌面宽度 (X轴)
     * @param {number} config.depth     - 桌面深度 (Z轴)
     * @param {number} config.height    - 桌面高度 / 桌腿高 (Y轴)
     * @param {number} config.thickness - 桌面厚度
     * @param {number} config.legThick  - 桌腿粗细（方形截面边长）
     */
    constructor(config = {}) {
        super();

        // 保存参数
        this.width = config.width ?? 2;
        this.depth = config.depth ?? 5;
        this.height = config.height ?? 2.2;
        this.thickness = config.thickness ?? 0.1;
        this.legThick = config.legThick ?? 0.1;

        // 构建模型 + 点击代理
        this._buildModel();
        this._addProxy();
    }

    // ---------- 构建模型 ----------
    _buildModel() {
        const { width, depth, height, thickness, legThick } = this;

        // 桌面
        const top = box(width, thickness, depth);
        top.position.y = height;
        this.add(top);

        // 四条桌腿
        const legPositions = [
            [-width / 2 + legThick / 2, -depth / 2 + legThick / 2],
            [ width / 2 - legThick / 2, -depth / 2 + legThick / 2],
            [-width / 2 + legThick / 2,  depth / 2 - legThick / 2],
            [ width / 2 - legThick / 2,  depth / 2 - legThick / 2]
        ];
        for (const [x, z] of legPositions) {
            const leg = box(legThick, height, legThick);
            leg.position.set(x, height / 2, z);
            this.add(leg);
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
            name: '书桌',
            description: '简约白色书桌，四条桌腿支撑，桌面宽大适合办公。',
            properties: [
                { label: '桌面尺寸', value: `${this.width} × ${this.depth}` },
                { label: '桌高', value: this.height },
                { label: '桌腿', value: '4 条' },
                { label: '位置', value: this._posText() }
            ],
            link: { href: '/blog', text: '进入主页 →' }
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
