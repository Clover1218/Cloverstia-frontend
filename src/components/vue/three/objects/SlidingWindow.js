// SlidingWindow.js —— 左墙推拉窗（白模黑线正交描边风格）
// 架构与 Laptop.js 一致：继承 THREE.Group，实现 hitTest / startDrag / moveDrag / endDrag / update / dispose
import * as THREE from 'three';

// ---- 全局共用材质（与 Laptop.js 保持一致） ----
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

// ---- 单扇窗扇：扇框 + 中梃竖线 +（可选）把手 ----
function createSash(width, height, thickness, withHandle) {
    const sash = new THREE.Group();
    const geo = new THREE.BoxGeometry(thickness, height, width);
    sash.add(new THREE.Mesh(geo, FILL));
    sash.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), MAT));

    // 中梃竖线：把扇面分成两格玻璃
    const mullion = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(thickness / 2 + 0.002, -height / 2 + 0.05, 0),
        new THREE.Vector3(thickness / 2 + 0.002, height / 2 - 0.05, 0)
    ]);
    sash.add(new THREE.Line(mullion, MAT));

    // 把手（只加在可滑动的扇上）
    if (withHandle) {
        const handle = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(thickness / 2 + 0.002, -0.1, -width / 2 + 0.06),
            new THREE.Vector3(thickness / 2 + 0.002, 0.1, -width / 2 + 0.06)
        ]);
        sash.add(new THREE.Line(handle, MAT));
    }
    return sash;
}

// ---- SlidingWindow 类 ----
export class SlidingWindow extends THREE.Group {
    /**
     * @param {Object} config
     * @param {number} config.width        - 外框宽度 (Z轴)
     * @param {number} config.height       - 外框高度 (Y轴)
     * @param {number} config.railSize     - 框料截面边长
     * @param {number} config.thickness    - 外框厚度 (X轴)
     * @param {number} config.sashThickness - 窗扇厚度
     */
    constructor(config = {}) {
        super();

        // 保存参数
        this.width = config.width ?? 2.8;
        this.height = config.height ?? 2.4;
        this.railSize = config.railSize ?? 0.14;
        this.thickness = config.thickness ?? 0.16;
        this.sashThickness = config.sashThickness ?? 0.05;

        // 由框尺寸推导：开口 / 扇面 / 最大行程
        this._openingW = this.width - this.railSize * 2;   // 开口宽度 (z)
        this._openingH = this.height - this.railSize * 2;  // 开口高度 (y)
        this._sashW = this._openingW / 2 - 0.03;           // 单扇宽度
        this._sashH = this._openingH - 0.06;               // 单扇高度
        this._maxSlide = this._openingW / 2;               // 滑动扇最大行程

        // ---- 交互状态 (私有) ----
        this._animP = 0;        // 当前开合进度 0(关) ~ 1(开)
        this._targetP = 0;      // 目标进度
        this._isDragging = false;
        this._lastClientX = 0;
        this._grabbed = false;
        this._moved = false;

        // ---- 构建模型 ----
        this._buildModel();
    }

    // ---- 构建模型 ----
    _buildModel() {
        const { width, height, railSize, thickness, sashThickness } = this;

        // 1. 窗洞（空白底，被窗扇遮挡，滑开后露出=打开）
        const voidGeo = new THREE.BoxGeometry(0.02, this._openingH, this._openingW);
        this.add(new THREE.Mesh(voidGeo, FILL));

        // 2. 固定窗框：上 / 下 / 左 / 右 四根框料
        const top = box(thickness, railSize, width);
        top.position.set(0, height / 2 - railSize / 2, 0);
        this.add(top);

        const bottom = box(thickness, railSize, width);
        bottom.position.set(0, -height / 2 + railSize / 2, 0);
        this.add(bottom);

        const left = box(thickness, height, railSize);
        left.position.set(0, 0, -width / 2 + railSize / 2);
        this.add(left);

        const right = box(thickness, height, railSize);
        right.position.set(0, 0, width / 2 - railSize / 2);
        this.add(right);

        // 3. 固定扇（外侧轨道，占左半）
        this._sashOuter = createSash(this._sashW, this._sashH, sashThickness, false);
        this._sashOuter.position.set(0.1, 0, -this._openingW / 4);
        this.add(this._sashOuter);

        // 4. 滑动扇（内侧轨道，占右半，可左右平移）
        this._sashInnerClosedZ = this._openingW / 4;
        this._sashInner = createSash(this._sashW, this._sashH, sashThickness, true);
        this._sashInner.position.set(0.16, 0, this._sashInnerClosedZ);
        this.add(this._sashInner);

        // 5. 窗台（向室内探出）
        const sill = box(0.5, 0.06, width + 0.3);
        sill.position.set(0.18, -height / 2 - 0.03, 0);
        this.add(sill);

        // 6. 交互代理盒子（不可见，用于射线检测）
        this._proxy = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, height + 0.2, width + 0.2),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this._proxy.position.x = 0.15;
        this.add(this._proxy);
    }

    // ---- 命中检测 (由外部 pointerdown 调用) ----
    /**
     * 检测鼠标/触摸是否点中本窗户
     * @param {number} clientX
     * @param {number} clientY
     * @param {THREE.Camera} camera
     * @returns {boolean} 是否命中
     */
    hitTest(clientX, clientY, camera) {
        const mouse = new THREE.Vector2(
            (clientX / window.innerWidth) * 2 - 1,
            -(clientY / window.innerHeight) * 2 + 1
        );
        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);

        // 只检测代理盒子
        const hits = ray.intersectObject(this._proxy);
        if (hits.length > 0) {
            this._grabbed = true;
            return true;
        }
        return false;
    }

    // ---- 开始拖拽 (由外部 pointerdown 调用) ----
    startDrag(clientX) {
        this._isDragging = true;
        this._lastClientX = clientX;
        this._moved = false;
    }

    // ---- 拖拽移动 (由外部 pointermove 调用) ----
    /**
     * 水平拖动 → 滑动扇沿 z 轴平移
     * @param {number} clientX
     * @param {number} clientY
     * @param {number} frustumSize
     * @param {THREE.Camera} camera
     */
    moveDrag(clientX, clientY, frustumSize, camera) {
        if (!this._isDragging) return;

        const dx = clientX - this._lastClientX;
        this._lastClientX = clientX;

        // 死区：先移动一点点才认为是拖动（区分单击/拖动）
        if (!this._moved && Math.abs(dx) > 6) {
            this._moved = true;
        }
        if (!this._moved) return;

        // 鼠标位移 → 世界位移（沿相机右向量，只取 z 分量 = 滑动方向）
        const aspect = window.innerWidth / window.innerHeight;
        const wP = (frustumSize * aspect) / window.innerWidth;
        const cR = new THREE.Vector3();
        cR.setFromMatrixColumn(camera.matrixWorld, 0);
        const dz = cR.z * (dx * wP);

        // 窗扇跟随光标：光标右移 → 窗扇向打开位（-z）移动
        this._animP = THREE.MathUtils.clamp(this._animP - dz / this._maxSlide, 0, 1);
        this._targetP = this._animP; // 实时跟随鼠标
    }

    // ---- 结束拖拽 (由外部 pointerup 调用) ----
    endDrag() {
        if (!this._isDragging) return;

        if (!this._moved) {
            // 单击：切换开关
            this._targetP = this._targetP > 0.5 ? 0 : 1;
        } else {
            // 拖动后吸附到最近状态
            this._targetP = this._animP > 0.5 ? 1 : 0;
        }

        this._isDragging = false;
        this._grabbed = false;
    }

    // ---- 信息展示 (由外部点击时调用) ----
    getInfo() {
        return {
            name: '推拉窗',
            description: '左右平移的推拉窗：单击开合，水平拖动调节开度。',
            properties: [
                { label: '尺寸', value: `${this.width} × ${this.height}` },
                { label: '状态', value: this._animP > 0.5 ? '已打开' : '已关闭' },
                { label: '位置', value: `(${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)})` }
            ]
        };
    }

    // ---- 每帧更新 (由外部动画循环调用) ----
    update() {
        // 平滑插值
        this._animP += (this._targetP - this._animP) * 0.15;
        if (Math.abs(this._animP - this._targetP) < 0.001) {
            this._animP = this._targetP;
        }

        // 滑动扇沿 z 平移：关=右半，开=滑到左半与固定扇重叠
        if (this._sashInner) {
            this._sashInner.position.z = this._sashInnerClosedZ - this._maxSlide * this._animP;
        }
    }

    // ---- 资源清理 (由外部销毁时调用) ----
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
