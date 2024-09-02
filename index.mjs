import * as THREE from './lib/three.module.js'

// Constants for the number of balls and modifiers for mouse to interface movement
const BALL_COUNT = 30 // Number of balls to be created in the scene
const SHINY_COUNT = 7 // Number of shiny balls to be created in the scene
const CAMERA_MOVE_MODIFIER = 0 // Modifier for camera movement speed
const CARTON_MOVE_MODIFIER = 0.1 // Modifier for carton movement speed

// CanvasDriver class, responsible for managing the main 3D scene
class CanvasDriver {
    constructor() {
        // Initializing CartonDriver for a secondary 3D object
        this.carton = new CartonDriver()
        // Mouse setup with initial centered values
        this.mouse = {x: 0.5, y: 0.5}
        
        // Window dimensions for calculating half-width and half-height
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        // Selecting the canvas element for rendering
        this.canvas = document.querySelector('canvas#c')

        // Setting up the perspective camera
        this.camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 1, 10000 )
        this.camera.position.z = 1800// Positioning the camera in the scene

       // Creating a new scene and object group for balls
        this.scene = new THREE.Scene()
        this.balls = new THREE.Object3D()
        // Setting the background color of the scene
        this.scene.background = new THREE.Color( 0x728C69 )

       // Adding a directional light to the scene
        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 0, 0, 1 );
        this.scene.add( light );

        
        // Defining geometry and materials for the balls
        const radius = 20;
        const geometry1 = new THREE.IcosahedronGeometry( radius, 1 );

        const material = new THREE.MeshPhongMaterial( {
            color: 0x597d35,
            flatShading: true,
            vertexColors: true,
            shininess: 2
        } );

        const wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } );

        this.meshes = [] // Array to hold all ball meshes

        // Creating ball meshes with wireframe material
        for (let i = 0; i < BALL_COUNT; i++) {
            this.meshes.push({
                mesh: new THREE.Mesh(geometry1, wireframeMaterial),
                heading: this.make_new_heading(),
                rotation: this.make_new_heading().multiplyScalar(1/300)
            })

        }

        // Creating shiny ball meshes with solid material
        for (let i = 0; i < SHINY_COUNT; i++) {
            this.meshes.push({
                mesh: new THREE.Mesh(geometry1, material),
                heading: this.make_new_heading(),
                rotation: this.make_new_heading().multiplyScalar(1/200)
            })

        }

        // Resetting position and other properties of each mesh
        for (let i = 0; i < this.meshes.length; i++) {
            this.reset_mesh(i)

        }

        // BIG BOY (unused)
        this.bgmesh = {
            mesh: new THREE.Mesh(
                new THREE.IcosahedronGeometry(1900, 1),
                wireframeMaterial
            ),
            rotation: new THREE.Vector3(0.0001, 0, 0.0001),
            heading: new THREE.Vector3(0, 0, 0)
        }

        // Adding all meshes to the balls group
        for (let i in this.meshes) {
            this.balls.add(this.meshes[i].mesh)
        }
        // Adding the balls group to the scene
        this.scene.add(this.balls)




        // Setting up the renderer
        this.renderer = new THREE.WebGLRenderer( {
            antialias: true,
            canvas: this.canvas
        } )
        this.renderer.setPixelRatio( window.devicePixelRatio )
        this.renderer.setSize( window.innerWidth, window.innerHeight )

    }
    // Method to render the scene
    render() {
        
        // this.balls.rotation.x += ( this.mouse.x - this.balls.rotation.x ) * CAMERA_MOVE_MODIFIER;
        // this.balls.rotation.y += ( - this.mouse.y - this.balls.rotation.y ) * CAMERA_MOVE_MODIFIER;

        // this.camera.lookAt( this.scene.position );
        

        this.renderer.render( this.scene, this.camera );
    }
    
    // Animation loop for continuous rendering
    animate() {
        requestAnimationFrame(this.animate.bind(this))// Recursively calls animate
        this.carton.animate()// Animates the carton object

        // Calculating target rotation based on mouse position
        const targetRotation = new THREE.Vector3(
            this.mouse.x * CAMERA_MOVE_MODIFIER,
            this.mouse.y * CAMERA_MOVE_MODIFIER,
            0
        )
        const currentRotation = new THREE.Vector3(
            this.balls.rotation.x,
            this.balls.rotation.y,
            this.balls.rotation.z
        )

        // Smoothly interpolates between current and target rotations
        currentRotation.lerp(targetRotation, 0.5)

        // Updating balls rotation
        this.balls.rotation.x = currentRotation.x
        this.balls.rotation.y = currentRotation.y
        this.balls.rotation.z = currentRotation.z
        // this.balls.rotation.y = (this.mouse.y) * CAMERA_MOVE_MODIFIER

        // Updating position and rotation of each mesh
        for (let i = 0; i < this.meshes.length ; i++) {
            this.meshes[i].mesh.position.add(this.meshes[i].heading)
            this.meshes[i].mesh.rotation.x += this.meshes[i].rotation.x
            this.meshes[i].mesh.rotation.y += this.meshes[i].rotation.y
            this.meshes[i].mesh.rotation.z += this.meshes[i].rotation.z

            // Resetting the mesh if it reaches its target
            if (this.meshes[i].mesh.position.distanceTo(this.meshes[i].target) < 100) {
                this.reset_mesh(i)
            }
        }


        this.render() //Render scene

    }

    // Method to handle window resize
    on_window_resize() {

        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );

        this.carton.on_window_resize()
    }

    // Method to reset the position and heading of a mesh
    reset_mesh(index) {
        const obj = this.meshes[index]

        // place somewhere on the screen
        obj.mesh.position.x = -400 - (Math.random() * 2400)
        obj.mesh.position.y = -100 - (Math.random() * 700)
        obj.mesh.position.z = -400 - (Math.random() * 2400)

        // generate a random target
        const target  = new THREE.Vector3(
            600 + (Math.random() * 200),
            200 + (Math.random() * 50),
            600 + (Math.random() * 200),
        )

        obj.target = target.clone()
        // create a heading
        const heading = target.sub(obj.mesh.position).normalize().multiplyScalar(0.5)

        obj.heading = heading

        obj.lifetime = 0
        obj.mesh.material.opacity = 1

    }
    
    // Method to generate a new random heading
    make_new_heading() {
        return new THREE.Vector3(
            Math.random(),
            Math.random(),
            Math.random()
        )
    }

    // Method to handle mouse movement
    on_mouse_move(e) {
        this.mouse.x = (e.clientX / window.innerWidth)
        this.mouse.y = (e.clientY / window.innerHeight)
        this.carton.set_mouse(this.mouse)
    }
}

// CartonDriver class manages a 3D carton object
class CartonDriver {
    constructor() {
        
        // Selecting the canvas for the carton
        this.canvas = document.querySelector('canvas#carton')
        const rect = this.canvas.getBoundingClientRect()
        // box art
        const carton_geometry = new THREE.BoxGeometry(13,20,7);
        // const wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } );
        const basic_material = new THREE.MeshPhongMaterial({color: 0xbacdb0, roughness: 0.5 })
        
        this.carton = new THREE.Mesh(carton_geometry, basic_material);
        this.carton.position.z = 0
        this.carton.position.x = 0

        this.scene = new THREE.Scene()
        this.scene.add(this.carton)

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 0, 0, 1 );
        this.scene.add( light );

        this.camera = new THREE.PerspectiveCamera( 20, rect.width / rect.height, 1, 10000 )
        this.camera.position.z = 100

        this.mouse = {x: 0, y: 0}

        // renderer
        this.renderer = new THREE.WebGLRenderer( {
            antialias: true,
            alpha: true,
            canvas: this.canvas
        } )
        this.renderer.setClearColor( 0x000000, 0 ) // the default
        this.scene.background = null
        this.renderer.setPixelRatio( window.devicePixelRatio )
        this.renderer.setSize( rect.width, rect.height)
    }

    set_mouse(mouse) {
        this.mouse = mouse
    }

    on_window_resize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        const rect = this.canvas.getBoundingClientRect()

        this.renderer.setSize( rect.width, rect.height );

    }
    render() {
        this.renderer.render( this.scene, this.camera );

    }

    animate() {
        this.carton.rotation.x = this.mouse.y * CARTON_MOVE_MODIFIER
        this.carton.rotation.y = this.mouse.x * CARTON_MOVE_MODIFIER
        this.render()
    }

}

class WaitlistSignup {
    constructor(form_selector) {
        this.form = document.querySelector(form_selector)

        this.form.addEventListener(
            'submit',
            this.handleForm.bind(this)
        )
    }

    async handleForm(e) {
        e.preventDefault()

        this.form.classList.add('waitlist__form--loading')

        const email_inp = this.form.querySelector('input[type="email"]')

        console.log(email_inp.value)

        let r = await fetch('https://link.exactics.science/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email_inp.value
            })
        })

        r = await r.json()


        if (r.ok) {
            Swal.fire({
              title: 'You\'re on the list!',
              text: 'We\'ll be in touch when we\'re ready to launch.',
              icon: 'success'
            })

            this.form.classList.remove('waitlist__form--loading')
            email_inp.value = ''
        }

    }
}
 
window.onload = () => {
    window.cd = new CanvasDriver()
    window.cd.animate()

    window.onresize = () => cd.on_window_resize()
    window.addEventListener('mousemove', e => cd.on_mouse_move(e))

    window.waitlist_handler = new WaitlistSignup('#waitlist')
}

