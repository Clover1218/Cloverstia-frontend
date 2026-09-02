// Chair.js
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
// ---- 复用你已有的全局材质和工具 ----
// 如果这些已经在全局定义，可以移除这里的定义，直接引用外部
const MAT = new THREE.LineBasicMaterial({ color: 0x000000 });
const FILL = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
});

function box(w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, FILL);
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, MAT);
    const group = new THREE.Group();
    group.add(mesh);
    group.add(line);
    return group;
}

// ---- Chair 类 ----
export class Chair extends THREE.Group {
    /**
     * @param {Object} config
     * @param {number} config.seatWidth  - 座面宽 (X轴)
     * @param {number} config.seatDepth  - 座面深 (Z轴)
     * @param {number} config.seatHeight - 座面离地高度 (Y轴)
     * @param {number} config.backHeight - 靠背高度
     * @param {number} config.legThick   - 腿的粗细 (方形截面边长)
     */
    constructor(config = {}) {
        super();

        // 参数
        this.seatWidth = config.seatWidth ?? 1.0;
        this.seatDepth = config.seatDepth ?? 1.0;
        this.seatHeight = config.seatHeight ?? 1.4;
        this.backHeight = config.backHeight ?? 2;
        this.legThick = config.legThick ?? 0.1;

        // 构建模型
        this._buildModel();

        // 可选：添加一个交互代理（用于点击检测）
        this._addProxy();
    }

    // ---------- 构建模型 ----------
    _buildModel() {
        const { seatWidth, seatDepth, seatHeight, backHeight, legThick } = this;

        // --- 1. 四条腿 ---
        const legPositions = [
            [-seatWidth/2 + legThick/2, -seatDepth/2 + legThick/2],
            [ seatWidth/2 - legThick/2, -seatDepth/2 + legThick/2],
            [-seatWidth/2 + legThick/2,  seatDepth/2 - legThick/2],
            [ seatWidth/2 - legThick/2,  seatDepth/2 - legThick/2],
        ];
        for (const [x, z] of legPositions) {
            const leg = box(legThick, seatHeight, legThick);
            leg.position.set(x, seatHeight / 2, z);
            this.add(leg);
        }

        // --- 2. 座面 ---
        const seat = box(seatWidth, 0.06, seatDepth);
        seat.position.set(0, seatHeight + 0.03 , 0);
        this.add(seat);

        // --- 3. 靠背（两根立柱 + 横梁） ---
        // 靠背位置在座面后沿 (Z负方向)
        const backZ = -seatDepth / 2 + 0.02;
        // 靠背立柱
        const pillarPositions = [
            [-seatWidth/2 + legThick/2, -seatDepth/2 + legThick/2],
            [ seatWidth/2 - legThick/2, -seatDepth/2 + legThick/2],
        ];
        for (const [x, z] of pillarPositions) {
            const pillar = box(legThick, backHeight, legThick);
            pillar.position.set(x, seatHeight + backHeight / 2, z);
            this.add(pillar);
        }

        const boardWidth = seatWidth - legThick;
        const boardHeight = backHeight - 0.06; // 略小于总高度，留出上下边距
        const boardThick = 0.04; // 薄板厚度
        
        const backBoard = box(boardWidth, boardHeight, boardThick);
        // 位置：在立柱的前表面略微靠外（让描边清晰可见，避免与立柱完全重叠）
        // Z方向：立柱中心在 backZ，前表面在 backZ + legThick/2，板子放在这里稍微突出一点
        backBoard.position.set(0, seatHeight + backHeight / 2, backZ + legThick/2 + 0.01);
        this.add(backBoard);
    }

    // ---------- 添加交互代理（可选） ----------
    _addProxy() {
        // 如果椅子需要点击交互，可以加一个不可见的盒子作为点击区域
        // 尺寸大致覆盖整个椅子
        const proxy = new THREE.Mesh(
            new THREE.BoxGeometry(this.seatWidth + 0.2, this.seatHeight + this.backHeight + 0.2, this.seatDepth + 0.2),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        proxy.position.set(0, (this.seatHeight + this.backHeight) / 2, 0);
        this.add(proxy);
        // 存储引用便于 hitTest
        this._proxy = proxy;
    }

    /**
     * 射线命中检测（如果加了代理）
     */
    hitTest(clientX, clientY, camera) {
        if (!this._proxy) return false;
        const mouse = new THREE.Vector2(
            (clientX / window.innerWidth) * 2 - 1,
            -(clientY / window.innerHeight) * 2 + 1
        );
        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);
        const hits = ray.intersectObject(this._proxy);
        return hits.length > 0;
    }

    /**
     * 信息展示（外部点击时调用）
     */
    getInfo() {
        return {
            name: '椅子',
            description: '带靠背的简约椅子，可搭配书桌使用。',
            properties: [
                { label: '座面', value: `${this.seatWidth} × ${this.seatDepth}` },
                { label: '座高', value: this.seatHeight },
                { label: '靠背高', value: this.backHeight },
                { label: '位置', value: `(${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)})` }
            ]
        };
    }

    // ---------- 更新循环（可扩展） ----------
    update(deltaTime) {
        // 可以添加动画，比如旋转或呼吸效果
        // 默认无操作
    }

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