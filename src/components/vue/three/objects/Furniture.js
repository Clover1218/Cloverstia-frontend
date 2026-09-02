import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// 你的全局材质（和之前保持一致）
const FILL = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
});
const LINE = new THREE.LineBasicMaterial({ color: 0x000000 });

/**
 * 递归遍历模型，替换材质为白模黑线风格
 * @param {THREE.Object3D} object - 模型根节点
 * @returns {THREE.Group} 处理后的组（包含原始网格 + 边缘线）
 */
function convertToWhiteBoxStyle(object) {
    const resultGroup = new THREE.Group();

    object.traverse((child) => {
        // 只处理网格
        if (child.isMesh) {
            // 1. 创建白色填充材质（保留原始几何体）
            const mesh = new THREE.Mesh(child.geometry.clone(), FILL);
            mesh.position.copy(child.position);
            mesh.rotation.copy(child.rotation);
            mesh.scale.copy(child.scale);
            resultGroup.add(mesh);

            // 2. 创建黑色边缘线
            const edges = new THREE.EdgesGeometry(child.geometry);
            const line = new THREE.LineSegments(edges, LINE);
            line.position.copy(child.position);
            line.rotation.copy(child.rotation);
            line.scale.copy(child.scale);
            resultGroup.add(line);
        }
    });

    return resultGroup;
}
// 创建加载器
// const loader = new GLTFLoader();

// loader.load(
//     ,  // 模型路径（放在 public 目录下）
//     (gltf) => {
//     const rawModel = gltf.scene;
//     // 转换为白模黑线风格
//     const styledModel = convertToWhiteBoxStyle(rawModel);
//     scene.add(styledModel);
// });


export class Furniture extends THREE.Group {
    /**
     * @param {string} modelPath - GLB 文件路径
     * @param {Object} config - 可选配置
     */
    constructor(modelPath, config = {}) {
        super();
        this.modelPath = modelPath;
        this.position.set(config.x || 0, config.y || 0, config.z || 0);
        this.rotation.y = config.rotationY || 0;

        // 加载状态
        this.isLoaded = false;
        this._loading = false;

        // 自动加载
        this._loadModel();
    }

    /**
     * 加载 GLB 模型并转换为白模黑线风格
     */
    _loadModel() {
        if (this._loading) return;
        this._loading = true;

        const loader = new GLTFLoader();
        loader.load(
            this.modelPath,
            (gltf) => {
                const rawModel = gltf.scene;
                // 转换风格
                const styledGroup = this._convertToWhiteBoxStyle(rawModel);
                styledGroup.scale.set(8, 8, 8);
                // 添加到自身（因为继承 THREE.Group）
                this.add(styledGroup);
                this.isLoaded = true;
                this._loading = false;
                console.log('模型加载完成:', this.modelPath);
            },
            undefined,
            (error) => {
                console.error('模型加载失败:', error);
                this._loading = false;
            }
        );
    }

    /**
     * 递归转换材质
     */
    _convertToWhiteBoxStyle(object, thresholdAngle = 20) {
        const resultGroup = new THREE.Group();

        object.traverse((child) => {
            if (child.isMesh) {
                // 白色填充
                const mesh = new THREE.Mesh(child.geometry.clone(), FILL);
                mesh.position.copy(child.position);
                mesh.rotation.copy(child.rotation);
                mesh.scale.copy(child.scale);
                resultGroup.add(mesh);

                // 黑色边缘线
                const edges = new THREE.EdgesGeometry(child.geometry, thresholdAngle);
                const line = new THREE.LineSegments(edges, LINE);
                line.position.copy(child.position);
                line.rotation.copy(child.rotation);
                line.scale.copy(child.scale);
                resultGroup.add(line);
            }
        });

        return resultGroup;
    }

    /**
     * 每帧更新（可扩展，例如添加旋转动画）
     */
    update(deltaTime) {
        // 如果需要动画，在这里写
        // 例如：this.rotation.y += deltaTime * 0.1;
    }

    /**
     * 资源清理
     */
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

    /**
     * 判断模型是否加载完成
     */
    get loaded() {
        return this.isLoaded;
    }
}