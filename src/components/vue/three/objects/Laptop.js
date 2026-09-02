// Laptop.js
import * as THREE from 'three';

// ---- 全局共用材质和工具函数（可以抽离到单独文件） ----
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
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, MAT);
    const group = new THREE.Group();
    group.add(mesh);
    group.add(line);
    return group;
}

// ---- 开合角度常量 ----
const CLOSED_ANGLE = Math.PI / 2;   // 合上
const OPEN_ANGLE = -0.52;           // 打开约120°

// ---- Laptop 类 ----
export class Laptop extends THREE.Group {
    /**
     * @param {Object} config
     * @param {number} config.width - 宽度 (X轴)
     * @param {number} config.depth - 深度 (Z轴)
     * @param {number} config.screenHeight - 屏幕高度 (Y轴)
     * @param {number} config.thickness - 厚度
     */
    constructor(config = {}) {
        super(); // 调用 THREE.Group 构造函数

        // 保存参数
        this.width = config.width ?? 1.2;
        this.depth = config.depth ?? 0.9;
        this.screenHeight = config.screenHeight ?? 0.9;
        this.thickness = config.thickness ?? 0.08;

        // ---- 交互状态 (私有) ----
        this._animP = 0;           // 当前开合进度 (0~1)
        this._targetP = 0;         // 目标进度
        this._isDragging = false;
        this._lastClientY = 0;
        this._grabbedLid = false;
        this._moved = false;

        // ---- 构建模型 ----
        this._buildModel();

    }

    // ---- 构建模型 ----
    _buildModel() {
        const { width, depth, screenHeight, thickness } = this;

        // 1. 底座
        const base = box(width, thickness, depth);
        base.position.y = thickness / 2;
        this.add(base);

        // 键盘线
        const keyboardLine = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-width / 2 + 0.1, thickness + 0.01, 0.2),
            new THREE.Vector3(width / 2 - 0.1, thickness + 0.01, 0.2)
        ]);
        this.add(new THREE.Line(keyboardLine, MAT));

        // 触控板
        const touchpad = box(width * 0.4, 0.01, depth * 0.25);
        touchpad.position.set(0, thickness + 0.005, depth / 2 - depth * 0.15);
        this.add(touchpad);

        // 2. 屏幕铰链 (旋转轴)
        this._screenPivot = new THREE.Group();
        this._screenPivot.position.set(0, thickness, -depth / 2);
        this.add(this._screenPivot);

        // 屏幕背板
        const screen = box(width, screenHeight, thickness * 2);
        screen.position.set(0, screenHeight / 2, -thickness);
        this._screenPivot.add(screen);

        // 屏幕发光面
        const screenFace = new THREE.Mesh(
            new THREE.PlaneGeometry(width * 0.8, screenHeight * 0.8),
            FILL
        );
        screenFace.position.set(0, screenHeight / 2, 0.01);
        this._screenPivot.add(screenFace);

        // 代码线条组 (默认隐藏)
        this._contentGroup = new THREE.Group();
        this._contentGroup.position.set(0, screenHeight / 2, 0.02);
        for (let i = 0; i < 3; i++) {
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-width * 0.3, -screenHeight * 0.3 + i * screenHeight * 0.2, 0),
                new THREE.Vector3(width * 0.3, -screenHeight * 0.3 + i * screenHeight * 0.2, 0)
            ]);
            this._contentGroup.add(new THREE.Line(lineGeo, MAT));
        }
        this._contentGroup.visible = false;
        this._screenPivot.add(this._contentGroup);

        // 3. 交互代理盒子 (不可见，用于射线检测)
        this._proxy = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.1, screenHeight + 0.2, depth + 0.2),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this._proxy.position.y = thickness + screenHeight / 2;
        this.add(this._proxy);
    }

    // ---- 命中检测 (由外部 pointerdown 调用) ----
    /**
     * 检测鼠标/触摸是否点中本笔记本
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
            // 将击中点转换到本地坐标
            const localPoint = this.worldToLocal(hits[0].point.clone());
            // 判断是否抓住了屏幕 (高于铰链)
            this._grabbedLid = localPoint.y > this.thickness + 0.05;
            // 可以在这里触发点击回调，但我们采用 startDrag 方式
            return true;
        }
        return false;
    }

    // ---- 开始拖拽 (由外部 pointerdown 调用) ----
    startDrag(clientY) {
        this._isDragging = true;
        this._lastClientY = clientY;
        this._moved = false;
        // 如果点中后直接进入拖拽，_grabbedLid 已在 hitTest 中设置
    }

    // ---- 拖拽移动 (由外部 pointermove 调用) ----
    moveDrag(clientY, frustumSize) {
        if (!this._isDragging) return;

        const dy = clientY - this._lastClientY;
        this._lastClientY = clientY;

        if (!this._moved && Math.abs(dy) > 6) {
            this._moved = true;
        }

        if (this._grabbedLid && this._moved) {
            // 灵敏度计算
            const lidPx = this.screenHeight * (window.innerHeight / frustumSize);
            const k = Math.abs(OPEN_ANGLE - CLOSED_ANGLE) / lidPx;
            this._animP = THREE.MathUtils.clamp(this._animP - dy * k, 0, 1);
            this._targetP = this._animP; // 实时跟随手指
        }
    }

    // ---- 结束拖拽 (由外部 pointerup 调用) ----
    endDrag() {
        if (!this._isDragging) return;

        if (!this._moved) {
            // 单击：切换开关
            this._targetP = this._targetP > 0.5 ? 0 : 1;
        } else if (this._grabbedLid) {
            // 拖动后吸附到最近状态
            this._targetP = this._animP > 0.5 ? 1 : 0;
        }

        this._isDragging = false;
    }

    // ---- 信息展示 (由外部点击时调用) ----
    getInfo() {
        return {
            name: '笔记本电脑',
            description: '可开合屏幕的笔记本：单击开合，拖动调节屏幕角度。',
            properties: [
                { label: '屏幕尺寸', value: `${this.width} × ${this.screenHeight}` },
                { label: '状态', value: this._animP > 0.5 ? '已打开' : '已合上' },
                { label: '位置', value: `(${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)})` }
            ]
        };
    }

    // ---- 每帧更新 (由外部动画循环调用) ----
    update() {
        // 平滑插值
        this._animP += (this._targetP - this._animP) * 0.12;
        if (Math.abs(this._animP - this._targetP) < 0.001) {
            this._animP = this._targetP;
        }

        // 应用旋转到屏幕铰链
        if (this._screenPivot) {
            const angle = CLOSED_ANGLE + (OPEN_ANGLE - CLOSED_ANGLE) * this._animP;
            this._screenPivot.rotation.x = angle;
        }

        // 控制代码线条显示
        if (this._contentGroup) {
            this._contentGroup.visible = this._animP > 0.4;
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
        // 如果有纹理等其他资源，也在这里清理
        // 移除自身从父级 (由外部负责)
    }
}