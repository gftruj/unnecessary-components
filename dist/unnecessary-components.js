(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
require('./src/mesh');
require('./src/asourcemap/asourcemap');
require('./src/physics');
},{"./src/asourcemap/asourcemap":3,"./src/mesh":6,"./src/physics":12}],2:[function(require,module,exports){
function isPointInPolygon(point, vs) {
  // ray-casting algorithm based on
  // https://github.com/substack/point-in-polygon
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

  var x = point[0],
    y = point[1];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0],
      yi = vs[i][1];
    var xj = vs[j][0],
      yj = vs[j][1];

    var intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

module.exports =  {
  isPointInPolygon
}
},{}],3:[function(require,module,exports){
const PolygonUtils = require("./PolygonUtils");

require("./PolygonUtils")
var isPointInPolygon = PolygonUtils.isPointInPolygon

AFRAME.registerComponent("asourcemap", {
  schema: {
    map: { value: "" },
    imageWidth: { value: 0 },
    imageHeight: { value: 0 }
  },
  init: function () {
    this.polygons = [];
    this.imageData = null
    this.createAreas = this.createAreas.bind(this)
    this.checkForAreas = this.checkForAreas.bind(this)
    this.addListeners = this.addListeners.bind(this)
    this.removeListeners = this.removeListeners.bind(this)

    // wait until the image is ready
    let mesh = this.el.getObject3D("mesh");
    var idx = setInterval(e => {
      if (!mesh.material.map) return;
      clearInterval(idx);
      let image = mesh.material.map.image;

      // set the w / h if not provided
      this.imageData = {
        image: image,
        width: this.data.imageWidth ? this.data.imageWidth : image.width,
        height: this.data.imageHeight ? this.data.imageHeight : image.height
      }
      this.createAreas();
    }, 50);
  },
  createAreas: function () {
    // remove old info
    this.polygons.length = 0;

    // grab the map element
    var mapEl = document.querySelector(this.data.map);
    if (!mapEl) {
      console.warn("could not find", this.data.map);
      return;
    }
    var areas = mapEl.children;
    if (!areas.length) {
      console.warn("there are no areas in", this.data.map);
      return;
    }

    // iterate through the areas and fill the polygon data!
    for (let area of areas) {
      var shape = area.getAttribute("shape");
      var coords = area
        .getAttribute("coords")
        .trim()
        .split(",")
        .map(x => parseInt(x));

      let poly = [];
      if (shape === "rect") {
        // rect requires only topLeft and botRight
        poly = [[coords[0], coords[1]], [coords[0], coords[3]], [coords[2], coords[3]], [coords[2], coords[1]]]
      } else {
        for (let i = 0; i < coords.length; i += 2) {
          poly.push([coords[i], parseInt(coords[i + 1])]);
        }
      }
      this.polygons.push({
        area: poly,
        name: area.getAttribute("alt"),
        action: area.getAttribute("href")
      });
    }
  },
  checkForAreas: function (evt) {
    var uvPoint = evt.detail.intersection.uv;
    var x = uvPoint.x * this.imageData.width
    var y = this.imageData.height - uvPoint.y * this.imageData.height
    for (var i = 0; i < this.polygons.length; i++) {
      if (PolygonUtils.isPointInPolygon([x, y], this.polygons[i].area)) {
        this.el.emit("area-clicked", {area: this.polygons[i].name})
        window.location = this.polygons[i].action
      }
    }
  },
  addListeners: function () {
    this.el.addEventListener("click", this.checkForAreas)
  },
  removeListeners: function () {
    this.el.removeEventListener("click", this.checkForAreas)
  },
  play: function () {
    this.addListeners();
  },
  pause: function () {
    this.removeListeners();
  },
  update: function (oldData) {
    // if image is not yet ready, no need to update things.
    if (!this.image)
      return;

    if (oldData.imageWidth !== this.data.imageWidth || oldData.imageHeight !== this.data.imageHeight) {
      this.imageData.width = this.data.imageWidth ? this.data.imageWidth : this.imageData.image.width
      this.imageData.height = this.data.imageHeight ? this.data.imageHeight : this.imageData.image.height
    }
    this.createAreas();
  },
  remove: function () {
    removeListeners();
  }
});

},{"./PolygonUtils":2}],4:[function(require,module,exports){


module.exports = THREE.Box3Utils = (function() {
    /*
     * POLYFILL
     */
    var boneTransformPolyfill = null;
    if (typeof THREE.SkinnedMesh.prototype.boneTransform !== "function") {
      boneTransformPolyfill = (function(mesh, target, index) {
        var vertex = new THREE.Vector3();
        var temp = new THREE.Vector3();
        var skinned = new THREE.Vector3();
        var skinIndices = new THREE.Vector4();
        var skinWeights = new THREE.Vector4();
        var boneMatrix = new THREE.Matrix4();
        var skeleton,
          boneMatrices,
          geometry,
          position,
          skinIndex,
          skinWeight,
          bindMatrix,
          bindMatrixInverse,
          sw,
          si;
  
        return function(skinnedMesh, index, target) {
          skeleton = skinnedMesh.skeleton;
          boneMatrices = skeleton.boneMatrices;
          geometry = skinnedMesh.geometry;
  
          position = geometry.attributes.position;
          skinIndex = geometry.attributes.skinIndex;
          skinWeight = geometry.attributes.skinWeight;
  
          bindMatrix = skinnedMesh.bindMatrix;
          bindMatrixInverse = skinnedMesh.bindMatrixInverse;
  
          vertex.fromBufferAttribute(position, index);
          skinIndices.fromBufferAttribute(skinIndex, index);
          skinWeights.fromBufferAttribute(skinWeight, index);
  
          /*
           * Re-create the vertex shader job - just the vertices positions
           * see https://www.khronos.org/opengl/wiki/Skeletal_Animation
           * see Mugen87 answer https://discourse.threejs.org/t/object-bounds-not-updated-with-animation/3749/12
           */
  
          vertex.applyMatrix4(bindMatrix); // transform to bind space
          target.set(0, 0, 0);
          for (var j = 0; j < 4; j++) {
            sw = skinWeights.getComponent(j);
            if (sw === 0) continue;
  
            si = skinIndices.getComponent(j);
            sw = skinWeights.getComponent(j);
            boneMatrix.fromArray(boneMatrices, si * 16);
  
            // weighted vertex transformation
            temp
              .copy(vertex)
              .applyMatrix4(boneMatrix)
              .multiplyScalar(sw);
            target.add(temp);
          }
  
          return target.applyMatrix4(bindMatrixInverse); // back to local space
        };
      })();
    }
    /*
     * POLYFILL END
     */

    var skinnedVertex = new THREE.Vector3();
    var tmpBox = new THREE.Box3();

    function updateAABB(skinnedMesh, box, expand) {
      var geometry = skinnedMesh.geometry;
      var geometryIndex = geometry.index;
      var position = geometry.attributes.position;
      var idx = 0;
      var index = 0;
      
      var aabb = expand ? tmpBox : box;
      aabb.makeEmpty()
      // Distinguish indexed and non-indexed geometry
      var idx_max = geometryIndex ? geometryIndex.count : position.count;
  
      for (idx = 0; idx < idx_max; idx++) {
        index = geometryIndex ? geometryIndex.array[idx] : idx;
        if (boneTransformPolyfill)
          boneTransformPolyfill(skinnedMesh, index, skinnedVertex);
        else 
          skinnedMesh.boneTransform(index, skinnedVertex);
  
          //skinnedVertex.applyQuaternion(skinnedMesh.parent.parent.quaternion)
        // expand aabb
        aabb.expandByPoint(skinnedVertex);
      }
      aabb.applyMatrix4(skinnedMesh.matrixWorld);

      if (expand)
        box.union(aabb);
    }
    return {
      expandFromSkinnedMesh: function(skinnedMesh, aabb) {
        updateAABB(skinnedMesh, aabb, true);
      },
      fromSkinnedMesh: function(skinnedMesh, aabb) {
        updateAABB(skinnedMesh, aabb, false);
      }
    };
  })();
},{}],5:[function(require,module,exports){
require("./../lib/Box3Utils")

module.exports.Component = AFRAME.registerComponent("bbox-helper", {
    schema: {
      combine: { default: false }
    },
    init: function () {
      this.paused = false
      this.createBoxes = this.createBoxes.bind(this)
      this.removeBoxes = this.removeBoxes.bind(this)
      this.nodeMap = {};

      this.el.addEventListener("model-loaded", e => {
        let mesh = this.el.getObject3D("mesh");
        if (!mesh) mesh = this.el.object3D;
        mesh.traverse(node => {
          if (node.isSkinnedMesh) {
            this.skinnedMesh = node;
            this.nodeMap[node.uuid] = {
              mesh: node,
              box: new THREE.Box3()
            }
          }
        });

        if (!Object.keys(this.nodeMap).length) {
          this.nodeMap[0] = {
            mesh: this.el.object3D,
            box: new THREE.Box3()
          };
        }

        this.createBoxes()
      });
    },
    update: function (olddata) {
      // no changes  
      if (olddata && olddata.combine === this.data.combine)
        return;
      this.removeBoxes();
      this.createBoxes();
    },
    createBoxes: function () {
      for (uuid in this.nodeMap) {
        this.nodeMap[uuid].helper = new THREE.Box3Helper(
          this.nodeMap[uuid].box,
          0x00ff00
        );
        this.el.sceneEl.object3D.add(this.nodeMap[uuid].helper);

        // in case we want combined boxes, only one should be created
        if (this.data.combine) break
      }
    },
    removeBoxes: function () {
      for (uuid in this.nodeMap) {
        if (!this.nodeMap[uuid].helper) continue;

        this.el.sceneEl.object3D.remove(this.nodeMap[uuid].helper);
        this.nodeMap[uuid].helper.geometry.dispose();
        this.nodeMap[uuid].helper.material.dispose();
        delete this.nodeMap[uuid].helper;
      }
    },
    play: function () {
      this.paused = false;
    },
    pause: function () {
      this.paused = true;
    },
    tick: function () {
      if (this.paused || !Object.keys(this.nodeMap).length) return;
      let combine = this.data.combine
      let common_box_uuid = null

      for (uuid in this.nodeMap) {
        // Non - skinned case
        if (!this.nodeMap[uuid].mesh.isSkinnedMesh) {
          this.nodeMap[uuid].box.setFromObject(this.el.object3D);
          return;
        }
        // skinned model. Either separate boxes, or combined
        if (common_box_uuid && combine) {
          THREE.Box3Utils.expandFromSkinnedMesh(this.nodeMap[uuid].mesh, this.nodeMap[common_box_uuid].box);
        } else {
          THREE.Box3Utils.fromSkinnedMesh(this.nodeMap[uuid].mesh, this.nodeMap[uuid].box);
          common_box_uuid = uuid
        }
      }
    },
    remove: function () {
      this.removeBoxes()
    }
  });
},{"./../lib/Box3Utils":4}],6:[function(require,module,exports){
require('./bbox-helper');
require('./prevent-culling');
require('./redbox-from-object3d');
require('./model-relative-opacity');
},{"./bbox-helper":5,"./model-relative-opacity":7,"./prevent-culling":8,"./redbox-from-object3d":9}],7:[function(require,module,exports){
module.exports.Component = AFRAME.registerComponent('model-relative-opacity', {
    schema: {opacityFactor: {default: 0.5}},
    init: function () {
      this.nodeMap = {}
      this.prepareMap.bind(this)
      this.traverseMesh.bind(this)

      this.el.addEventListener('model-loaded', e=> {
        this.prepareMap()
        this.update()
      });
    },
    prepareMap: function() {
      this.traverseMesh(node => {
          this.nodeMap[node.uuid] = node.material.opacity
      })
    },
    update: function () {
      this.traverseMesh(node => {
          node.material.opacity = this.nodeMap[node.uuid] * this.data.opacityFactor
          node.material.transparent = node.material.opacity < 1.0;
          node.material.needsUpdate = true;
      })
    },
    play: function() {},
    pause: function(){},
    remove: function() {
        this.traverseMesh(node => {
            node.material.opacity = this.nodeMap[node.uuid]
            node.material.transparent = node.material.opacity < 1.0;
            node.material.needsUpdate = true;
        })
    },
    traverseMesh: function(func) {
      var mesh = this.el.getObject3D('mesh');
      var data = this.data;
      if (!mesh) { return; }
       mesh.traverse(node => {
        if (node.isMesh) {
          func(node)
        }
      }); 
    }
  });
},{}],8:[function(require,module,exports){
module.exports.Component = AFRAME.registerComponent("prevent-culling", {
    init: function () {
      this.cache = {};
      this.el.addEventListener("model-loaded", e => {
        let mesh = this.el.getObject3D("mesh");
        mesh.traverse(node => {
          if (node.isSkinnedMesh) {
            this.cache[node.uuid] = node.frustumCulled;
            node.frustumCulled = false;
          }
        });
      });
    },
    update: function () {},
    play: function () {},
    pause: function () {},
    remove: function () {
      // restore the original values
      let mesh = this.el.getObject3D("mesh");
      mesh.traverse(node => {
        if (node.isSkinnedMesh && this.cache[node.uuid] !== undefined) {
          node.frustumCulled = this.cache[node.uuid];
        }
      });
    }
  });
},{}],9:[function(require,module,exports){

module.exports.Component = AFRAME.registerComponent("redbox-from-object3d", {
    init: function () {
      this.box = new THREE.Box3();
      this.helper = new THREE.Box3Helper(
        this.box,
        0xff0000
      );
      this.el.sceneEl.object3D.add(this.helper)
      this.el.addEventListener("model-loaded", e => {
        this.mesh = this.el.getObject3D("mesh");
      })
    },
    update: function() {},
    play: function(){},
    pause: function() {},
    tick: function () {
      this.box.setFromObject(this.el.object3D)
    },
    remove: function () {
      this.el.sceneEl.object3D.remove(this.helper)
      this.helper.geometry.dispose()
      this.helper.material.dispose()
      this.helper = null
    }
  })
},{}],10:[function(require,module,exports){
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
        },
        offset: {
            default: "0 0 0"
        },
        orientation: {
            default: "0 0 0"
        },
        debug: {
            default: false
        }
    },
    init: function () {
        let data = this.data
        let self = this;

        // setup orientation, and offset
        this.orientation = new THREE.Quaternion();
        this.offset = new THREE.Vector3();

        // setup axesHelper
        let axesContainer = new THREE.Object3D();
        axesContainer.add(new THREE.AxesHelper(1));
        this.el.sceneEl.object3D.add(axesContainer)
        this.axesContainer = axesContainer;

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
        // check debug mode
        this.axesContainer.visible = this.data.debug;

        // apply offset and orientation;
        this.offset.copy(AFRAME.utils.coordinates.parse(this.data.offset));
        var orientation = AFRAME.utils.coordinates.parse(this.data.orientation);
        for (let angle in orientation) {
            orientation[angle] *= Math.PI / 180;
        }
        this.orientation.setFromEuler(new THREE.Euler(orientation.x, orientation.y, orientation.z))

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
        let offset = new THREE.Vector3(0, 0, 0);

        return function () {
            if (!this.bone) return;

            // get bone matrix
            // newer versions of threejs don't like getInverse()
            if (inverseWorldMatrix.invert) {
                inverseWorldMatrix.copy(this.el.object3D.matrix).invert();
            } else {
                inverseWorldMatrix.getInverse((this.el.object3D.matrix))
            }
            boneMatrix.multiplyMatrices(inverseWorldMatrix, this.bone.matrixWorld);

            // apply the predefined and user orientation BEFORE applying any position offsets
            this.boneDummy.object3D.quaternion.setFromRotationMatrix(boneMatrix)
            this.boneDummy.object3D.quaternion.multiply(this.orientation)

            // apply offset
            offset.copy(this.offset).applyQuaternion(this.boneDummy.object3D.quaternion)
            this.boneDummy.object3D.position.setFromMatrixPosition(boneMatrix).add(offset)

            // apply debug axes
            if (this.data.debug) {
                this.axesContainer.position.copy(this.boneDummy.object3D.getWorldPosition(this.axesContainer.position))
                this.axesContainer.quaternion.copy(this.boneDummy.object3D.getWorldQuaternion(this.axesContainer.quaternion))
            }
        }
    })()
})
},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
require('./bone-collider');
require('./cannon-material');

},{"./bone-collider":10,"./cannon-material":11}]},{},[1]);
