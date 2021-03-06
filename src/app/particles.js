/**
** author:YorkChan
** date:2017-03-18
**/
import TWEEN from 'tween.js';
import ASSET_WaltHeadLo from '../assets/WaltHeadLo.json';
const OrbitControls = require('three-orbit-controls')(THREE);
class Page {
	constructor() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,10000);
		this.camera.position.set(0,20,100);
		this.camera.lookAt(new THREE.Vector3(0,0,0));
		this.scene.add(this.camera);
		this.renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		this.renderer.setSize(window.innerWidth,window.innerHeight);
		this.renderer.setClearColor(0x111111);
		this.controls = new OrbitControls( this.camera, this.renderer.domElement );
		document.body.appendChild(this.renderer.domElement);
		this.resize();
		this.start();
		this.render();
	}
	resize() {
		window.addEventListener('resize',e => {
			this.camera.aspect = window.innerWidth/window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth,window.innerHeight);
		});
	}
	render() {
		let render = () => {
			this.update();
			this.renderer.render(this.scene,this.camera);
			requestAnimationFrame(render);
		}
		render();
	}
	async animateShow() {
		this.transform(this.particles.geometry,4000,'json',ASSET_WaltHeadLo);
		await Page.delay(8000);
		this.transform(this.particles.geometry,4000,'torus');
		await Page.delay(8000);
		this.transform(this.particles.geometry,4000,'cone');
		await Page.delay(8000);
		this.transform(this.particles.geometry,4000,'sphere');
		await Page.delay(8000);
	}
	start() {
		this.createLight();
		this.particles = this.createParticles(1600,1.5,50);
		this.animateShow();
		Page.loop(32000,() => this.animateShow());
	}
	async transform(orginGeo,duration,type,path) {
		const TYPE = {
			CUBE: 'cube',
			SPHERE: 'sphere',
			CONE: 'cone',
			CYLINDER: 'cylinder',
			TORUS : 'torus',
			JSON : 'json'
		};
		TWEEN.removeAll();
		let points = orginGeo.vertices;
		const n = Math.sqrt(points.length);
		let geometry;
		switch(type) {
			case TYPE.SPHERE : geometry = new THREE.SphereGeometry(20,n,n);break;
			case TYPE.CONE : geometry = new THREE.ConeGeometry(20,15,n,n);break;
			case TYPE.CYLINDER : geometry = new THREE.CylinderGeometry( 8, 8, 20, n,n );break;
			case TYPE.TORUS : geometry = new THREE.TorusGeometry( 15, 8, n, n );break;
			case TYPE.JSON: {
				geometry = await Page.getModel(path);
			};break;
		}
		
		for(let i in points) { // 遍历每个粒子，设置目标点位置
			new TWEEN.Tween(points[i])
				.to(geometry.vertices[i],duration)
				.onUpdate(() => {
					orginGeo.verticesNeedUpdate = true;
				})
				.start(); // 开启缓动动画
		}
		let originColor = this.material.color;
		new TWEEN.Tween(originColor) // 改变粒子颜色
				.to({r:Math.random(),g:Math.random(),b:Math.random()})
				.onUpdate(() => {
					this.material.color.set( this.r,this.g,this.b );
				})
				.start();
	}
	update() {
		TWEEN.update();
	}
	static getModel(path) { // 获取model的几何形状
		return new Promise(resolve => {
			let loader = new THREE.JSONLoader();
			loader.load(path,geometry => {
				resolve(geometry);
			})
		})
	}
	static loop(time,callback) { // 循环，相当于setInterval
            let start=false;
            let render = timestamp => {
                if (!start) start = timestamp;
                let progress = timestamp - start;
                if (progress > time) {
					start = timestamp;
					callback();
                }
                window.requestAnimationFrame(render);
            };
            window.requestAnimationFrame(render);
	}
	static delay(time) { //延迟时间，相当于settimeout
            return new Promise(resolve => {
                let start=false;
                let render = timestamp => {
                    if (!start) start = timestamp;
                    const progress = timestamp - start;
                    if (progress < time) {
                        window.requestAnimationFrame(render);
                    } else {
                        resolve();
                    }
            };
            window.requestAnimationFrame(render);
        });
    }
	createParticles(num,size,area) { // 创建粒子系统
		let drawArc = () => {
			// 创建画布
			const canvas = document.createElement('canvas');
			canvas.width	= 100;
			canvas.height	= 100;
			const ctx = canvas.getContext('2d');
			ctx.beginPath();
			ctx.arc(50,50,50, 0 ,2*Math.PI,true);
			ctx.fillStyle = "#ffffff";
			ctx.fill();
			return canvas;
		};
		let texture = new THREE.Texture(drawArc());
		texture.needsUpdate = true;
		let geometry = new THREE.Geometry();
		for (let i = 0; i < num; i ++ ) {

			let vertex = new THREE.Vector3();
			vertex.x = Math.random() * area - area/2;
			vertex.y = Math.random() * area - area/2;
			vertex.z = Math.random() * area - area/2;

			geometry.vertices.push( vertex );

		}
		this.material = new THREE.PointsMaterial( { size: size,color: 0xffffff ,sizeAttenuation:false, transparent: true } );
		let particles = new THREE.Points(geometry,this.material);
		this.scene.add(particles);
		return particles;
	}
	createLight() {
		// 创建光线
        	this.scene.add(new THREE.AmbientLight(0xFFFFFF));
        	const light = new THREE.DirectionalLight( 0xffffff, 0.3 );
		light.position.set( 50, 50, 50 );
		light.castShadow = true;
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 512;
		light.shadow.camera.near = 100;
		light.shadow.camera.far = 1200;
		light.shadow.camera.left = -1000;
		light.shadow.camera.right = 1000;
		light.shadow.camera.top = 350;
		light.shadow.camera.bottom = -350;
		this.scene.add( light );
	}
}
new Page();
