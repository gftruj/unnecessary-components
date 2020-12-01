module.exports.Component = AFRAME.registerComponent("cannon-material", {
    schema: {
        friction: { default: -1 },
        restitution: { default: -1 }
    },
    init: function () {
        this.system = this.el.sceneEl.systems.physics;
        this.defaultMaterial = this.system.driver.getMaterial("defaultMaterial")
        this.applyMaterial = this.applyMaterial.bind(this, this.data.friction, this.data.restitution)
    },
    update: function () {
        // apply the material
        if (this.el.body) {
            this.applyMaterial()
        } else {
            this.el.addEventListener('body-loaded', this.applyMaterial)
        }
    },
    applyMaterial: function (friction, restitution) {
        let mat = this.checkIfMaterialExists(this.system.driver.materials, friction, restitution)
        // the material may already exist
        if (mat) {
            this.el.body.material = mat;
            return;
        }

        // create a new material, and contactmaterial
        let name = "f" + friction + "r" + restitution
        this.system.driver.addMaterial({
            name: name
        })
        this.el.body.material = this.system.driver.getMaterial(name);

        var contactmaterial = new CANNON.ContactMaterial(this.defaultMaterial, this.el.body.material, {
            restitution: restitution
        })
        this.system.driver.world.addContactMaterial(contactmaterial);
    },
    checkIfMaterialExists(materials, friction, restitution) {
        for (let name in materials) {
            if (materials[name].friction === friction && materials[name].restitution === restitution)
                return materials[name];
        }
        return null;
    },
    pause: function () { },
    play: function () { },
    remove: function () {
        this.el.removeEventListener("body-loaded", this.applyMaterial)
    }
})