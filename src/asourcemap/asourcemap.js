require("./PolygonUtils")

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
    var x = uvPoint.x * this.imageData.imageWidth
    var y = this.imageData.imageHeight - uvPoint.y * this.imageData.imageHeight

    for (var i = 0; i < this.polygons.length; i++) {
      if (isPointInPolygon([x, y], this.polygons[i].area)) {
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
