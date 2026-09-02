// src/three/SceneManager.js
import * as THREE from 'three';
import { Laptop } from './objects/Laptop';
import { Chair } from './objects/Chair';
import { Furniture } from './objects/Furniture';
import { SlidingWindow } from './objects/SlidingWindow';
import { Desk } from './objects/Desk';
import { Bookshelf } from './objects/Bookshelf';
import { InfoPanel } from './ui/InfoPanel';

// ---- 工具函数和全局材质 ----
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

// ---- 创建地板的函数 ----
function createPlank(length, width, height) {
    const group = new THREE.Group();
    const plankGeo = new THREE.BoxGeometry(width, height, length);
    const plankMesh = new THREE.Mesh(plankGeo, FILL);
    group.add(plankMesh);
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(plankGeo), MAT));
    // 木纹条纹...
    // （保持原有逻辑，此处略）
    return group;
}

// ---- 主场景管理器 ----
export class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.worldGroup = null;
        this.cameraTarget = null;

        // 交互状态
        this.isPanning = false;
        this.previousMouse = { x: 0, y: 0 };
        this.activeObject = null;

        // 场景中的对象引用
        this.objects = {
            myLaptop: null,
            myWindow: null,
            desk: null,
            bookshelf: null,
            myChair: null,
            myFurniture: null,
        };

        // 尺寸参数
        this.frustumSize = 15;
        this.aspect = 1;

        // 信息面板
        this.infoPanel = new InfoPanel();

        // 绑定事件处理函数（便于后续移除）
        this._boundHandlers = {
            pointerdown: this._onPointerDown.bind(this),
            pointermove: this._onPointerMove.bind(this),
            pointerup: this._onPointerUp.bind(this),
            pointercancel: this._onPointerUp.bind(this),
            wheel: this._onWheel.bind(this),
            resize: this._onResize.bind(this),
        };
    }

    // ---- 初始化 ----
    init() {
        const container = this.container;
        this.aspect = container.clientWidth / container.clientHeight;

        // 1. 场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);

        // 2. 相机
        const { frustumSize, aspect } = this;
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            1000
        );
        this.cameraTarget = new THREE.Vector3(0, 1.9, 0);
        this.camera.position.set(14, 14, 14);
        this.camera.lookAt(this.cameraTarget);

        // 3. 渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // 4. 世界组
        this.worldGroup = new THREE.Group();
        this.scene.add(this.worldGroup);

        // 5. 构建场景内容
        this._buildScene();

        // 6. 绑定事件
        this._bindEvents();

        // 7. 启动动画循环
        this._animate();

        return this;
    }

    // ---- 构建场景内容 ----
    _buildScene() {
        const world = this.worldGroup;
        const { frustumSize } = this;

        // 地板
        // ... 铺地板逻辑（与原来一样）...

        // 墙壁
        const leftWall = box(0.2, 7, 12);
        leftWall.position.set(-6, 3.5, 0);
        world.add(leftWall);
        const backWall = box(12, 7, 0.2);
        backWall.position.set(0, 3.5, -6);
        world.add(backWall);

        // 窗户
        this.objects.myWindow = new SlidingWindow({ width: 2.8, height: 2.4 });
        this.objects.myWindow.position.set(-4.87, 3.4, -1.5);
        world.add(this.objects.myWindow);

        // 书架
        this.objects.bookshelf = new Bookshelf();
        this.objects.bookshelf.position.set(4, 0, -4);
        world.add(this.objects.bookshelf);

        // 桌子
        this.objects.desk = new Desk();
        this.objects.desk.position.set(-3, 0, -0.5);
        world.add(this.objects.desk);

        // 笔记本
        this.objects.myLaptop = new Laptop({
            width: 1.2,
            depth: 0.9,
            screenHeight: 0.9,
            thickness: 0.08,
        });
        this.objects.myLaptop.position.set(-0.5, 2.25, 0.5);
        this.objects.myLaptop.rotation.y = Math.PI / 2;
        world.add(this.objects.myLaptop);

        // 椅子
        this.objects.myChair = new Chair({});
        this.objects.myChair.position.set(2, 0, 0.5);
        this.objects.myChair.rotation.y = -Math.PI / 2;
        world.add(this.objects.myChair);
    }

    // ---- 事件绑定 ----
    _bindEvents() {
        const dom = this.renderer.domElement;
        const handlers = this._boundHandlers;

        dom.style.touchAction = 'none';
        dom.style.cursor = 'grab';

        dom.addEventListener('pointerdown', handlers.pointerdown);
        window.addEventListener('pointermove', handlers.pointermove);
        window.addEventListener('pointerup', handlers.pointerup);
        window.addEventListener('pointercancel', handlers.pointercancel);
        window.addEventListener('wheel', handlers.wheel, { passive: false });
        window.addEventListener('resize', handlers.resize);
    }

    // ---- 事件解绑 ----
    _unbindEvents() {
        const dom = this.renderer?.domElement;
        const handlers = this._boundHandlers;
        if (!dom) return;

        dom.removeEventListener('pointerdown', handlers.pointerdown);
        window.removeEventListener('pointermove', handlers.pointermove);
        window.removeEventListener('pointerup', handlers.pointerup);
        window.removeEventListener('pointercancel', handlers.pointercancel);
        window.removeEventListener('wheel', handlers.wheel);
        window.removeEventListener('resize', handlers.resize);
    }

    // ---- 交互事件处理 ----
    _onPointerDown(e) {
        const { objects, camera, infoPanel } = this;
        const { myLaptop, myWindow, desk, bookshelf, myChair } = objects;

        if (myLaptop.hitTest(e.clientX, e.clientY, camera)) {
            myLaptop.startDrag(e.clientY);
            this.activeObject = myLaptop;
            infoPanel.show(myLaptop.getInfo());
            return;
        }
        if (myWindow.hitTest(e.clientX, e.clientY, camera)) {
            myWindow.startDrag(e.clientX);
            this.activeObject = myWindow;
            infoPanel.show(myWindow.getInfo());
            return;
        }
        if (desk.hitTest(e.clientX, e.clientY, camera)) {
            infoPanel.show(desk.getInfo());
            return;
        }
        if (bookshelf.hitTest(e.clientX, e.clientY, camera)) {
            infoPanel.show(bookshelf.getInfo());
            return;
        }
        if (myChair.hitTest(e.clientX, e.clientY, camera)) {
            infoPanel.show(myChair.getInfo());
            return;
        }

        infoPanel.hide();
        this.isPanning = true;
        this.previousMouse.x = e.clientX;
        this.previousMouse.y = e.clientY;
    }

    _onPointerMove(e) {
        if (this.activeObject === this.objects.myLaptop) {
            this.objects.myLaptop.moveDrag(e.clientY, this.frustumSize);
            return;
        }
        if (this.activeObject === this.objects.myWindow) {
            this.objects.myWindow.moveDrag(e.clientX, e.clientY, this.frustumSize, this.camera);
            return;
        }

        if (this.isPanning) {
            const dx = e.clientX - this.previousMouse.x;
            const dy = e.clientY - this.previousMouse.y;
            this.previousMouse.x = e.clientX;
            this.previousMouse.y = e.clientY;

            const { frustumSize, aspect, camera, cameraTarget } = this;
            const wP = (frustumSize * aspect) / window.innerWidth;
            const hP = frustumSize / window.innerHeight;
            const cR = new THREE.Vector3();
            const cU = new THREE.Vector3();
            cR.setFromMatrixColumn(camera.matrixWorld, 0);
            cU.setFromMatrixColumn(camera.matrixWorld, 1);
            const mD = new THREE.Vector3()
                .add(cR.clone().multiplyScalar(-dx * wP))
                .add(cU.clone().multiplyScalar(dy * hP));
            camera.position.add(mD);
            cameraTarget.add(mD);
            camera.lookAt(cameraTarget);
            return;
        }

        // 悬停反馈
        const hit = this._hitTestAll(e.clientX, e.clientY);
        this.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    }

    _onPointerUp() {
        if (this.activeObject) {
            this.activeObject.endDrag();
            this.activeObject = null;
        }
        this.isPanning = false;
    }

    _onWheel(e) {
        e.preventDefault();
        this.frustumSize += e.deltaY * 0.05;
        this.frustumSize = Math.max(3, Math.min(50, this.frustumSize));
        this._updateCameraProjection();
    }

    _onResize() {
        const container = this.container;
        this.aspect = container.clientWidth / container.clientHeight;
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this._updateCameraProjection();
    }

    _updateCameraProjection() {
        const { camera, frustumSize, aspect } = this;
        camera.left = -frustumSize * aspect / 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
    }

    _hitTestAll(clientX, clientY) {
        const { objects, camera } = this;
        const { myLaptop, myWindow, desk, bookshelf, myChair } = objects;
        return (
            myLaptop.hitTest(clientX, clientY, camera) ||
            myWindow.hitTest(clientX, clientY, camera) ||
            desk.hitTest(clientX, clientY, camera) ||
            bookshelf.hitTest(clientX, clientY, camera) ||
            myChair.hitTest(clientX, clientY, camera)
        );
    }

    // ---- 动画循环 ----
    _animate() {
        const loop = () => {
            this._animationId = requestAnimationFrame(loop);

            // 更新所有对象
            const { myLaptop, myWindow, desk, bookshelf, myChair } = this.objects;
            myLaptop.update();
            myWindow.update();
            desk.update();
            bookshelf.update();
            myChair.update();

            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }

    // ---- 销毁 ----
    destroy() {
        // 停止动画
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }

        // 解绑事件
        this._unbindEvents();

        // 清理对象资源
        const { myLaptop, myWindow, desk, bookshelf, myChair } = this.objects;
        const allObjects = [myLaptop, myWindow, desk, bookshelf, myChair];
        for (const obj of allObjects) {
            if (obj && typeof obj.dispose === 'function') {
                obj.dispose();
            }
        }

        // 清理渲染器
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }

    // ---- 对外暴露的方法 ----
    resize() {
        this._onResize();
    }
}