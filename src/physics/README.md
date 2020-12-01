**bone-collider**

Adding a `static-body` collider for a certain bone.

**schema**

| **Name**    | **default**  | **description** |
|-------------|--------------|-----------------|
| bone        | ""           | A bone name, or a part of it. There will be a warning if multiple, or no bones are a match |
| shape       | "box"        | one of "box", "sphere" |
| halfExtents | "0.1 0.1 0.1"| box size               |
| radius      | "0.1"        | sphere radius          | 

**usage**

    <a-gltf-model position="" radius="" 
            bone-collider__righthand="bone: righHand; halfExtents: 0.15 0.15 0.15"
            bone-collider__lefthand="bone: leftHand; shape: sphere; radius: 0.15"></a-gltf-model>

Live example [here](https://gftruj.github.io/webzamples/aframe/physics/animated_models.html)
