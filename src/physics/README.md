**bone-collider**

Adding a `static-body` collider for a certain bone.

**schema**

| **Name**    | **default**  | **description** |
|-------------|--------------|-----------------|
| bone        | ""           | A bone name, or a part of it. There will be a warning if multiple, or no bones are a match |
| debug       | false        | show axis helper of the current collider origin. |
| shape       | "box"        | one of "box", "sphere" |
| halfExtents | "0.1 0.1 0.1"| box size               |
| radius      | "0.1"        | sphere radius          | 
| offset      | "0 0 0"      | collider offset from the origin|
| orientation | "0 0 0"      | root orientation added to the bone rotation [degrees]|


**usage**

    <a-gltf-model position="" radius="" 
            bone-collider__righthand="bone: righHand; halfExtents: 0.15 0.15 0.15"
            bone-collider__lefthand="bone: leftHand; shape: sphere; radius: 0.15"></a-gltf-model>

Simple example [here](https://gftruj.github.io/webzamples/aframe/physics/animated_models.html)
More complex example [here](https://gftruj.github.io/webzamples/aframe/physics/bone_collider.html)
