module.exports.Component = AFRAME.registerComponent("bone-collider", {
    multiple: true,
    schema: {
        bone: {
            type: "string", default: ""
        },
        shape: {
            default: "box", oneOf: ['box', 'sphere']
        },
        halfExtents: {
            default: "0.1 0.1 0.1", if: { shape: ['box'] }
        },
        radius: {
            default: "0.1", if: { shape: ['sphere'] }
        }
    },
    init: function () {
        let data = this.data
        let self = this;
        this.el.addEventListener("model-loaded", function modelReady() {
            // one model is enough for now
            self.el.removeEventListener("model-loaded", modelReady)

            let boneDummy = document.createElement("a-entity")
            boneDummy.setAttribute("static-body", "shape", "none")
            self.setDummyShape(boneDummy, data);
            self.bone = self.getBone(self.el.object3D, data.bone);
            self.el.appendChild(boneDummy)
            self.boneDummy = boneDummy
        })
    },
    update: function (olddata) {
        // if the bone / dummy are ready
        if (!(this.bone && this.boneDummy)) return;

        // if this is set, then the model should be ready
        if (this.data.boneName !== olddata.boneName) {
            this.bone = this.getBone(this.el.object3D, this.data.boneName);
        }

        // check if the shape needs updating
        for (let key of Object.keys(this.data)) {
            if (key === "bone") continue;
            if (this.data[key] !== olddata[key]) {
                this.setDummyShape(this.boneDummy, this.data);
                break;
            }
        }
    },
    setDummyShape(dummy, data) {
        let shapeName = "shape__bone";
        var config = null;
        if (data.shape === "sphere") {
            config = {
                "shape": data.shape,
                "radius": data.radius
            }
        } else {
            config = {
                "shape": data.shape,
                "halfExtents": data.halfExtents
            }
        }
        dummy.setAttribute(shapeName, config)
    },
    getBone: function (root, boneName) {
        // get exact bone
        bone = root.getObjectByName(boneName);
        // or look for bones containing the name
        if (!bone) {
            root.traverse(node => {
                if (node.name.includes(boneName) && node.isBone) {
                    if (bone) {
                        console.log("Multiple bones contain", boneName, "in their name.")
                    }
                    bone = node
                }
            })
        }
        if (!bone) {
            console.log(boneName, "was not found in the model")
        }
        return bone;
    },
    play: function () {
        this.paused = false;
    },
    pause: function () {
        this.paused = true;
    },
    remove: function () {
        this.bone = null
        // remove the dummy element
        this.boneDummy.removeAttribute("static-body")
        this.el.removeChild(this.boneDummy)
        this.boneDummy = null;
    },
    tick: (function () {
        let inverseWorldMatrix = new THREE.Matrix4();
        let boneMatrix = new THREE.Matrix4();

        return function () {
            if (!this.bone) return;

             // onTick in case object is moving
            if (inverseWorldMatrix.invert) {
                inverseWorldMatrix.copy(this.el.object3D.matrix).invert();
            } else {
                inverseWorldMatrix.getInverse((this.el.object3D.matrix)) 
            }
            boneMatrix.multiplyMatrices(inverseWorldMatrix, this.bone.matrixWorld);
            this.boneDummy.object3D.position.setFromMatrixPosition(boneMatrix)
        }
    })()
})