## asourcemap 

### usage:

```
<a-image material="src: #texture" asourcemap="#map"></a-image>
<map id="#map">
  <area shape="rect" alt="rectangle" coords="0,0, 50,50">
  <area shape="polygon" alt="polygon coords="25,25, 50,50, 40,0">
</map>
```

**Properties:** 

| **Property**        | **Description**   | 
| -------------       |:-------------:|
| **map**             | map selector  |
| **imageWidth**      | image width used for area coordinates      |
| **imageHeight**     | image height used for area coordinates     |


**Signals:**

| **Name**      | **data**                                         |
| ------------- |:-----------------:|
| area-clicked | e.detail.area contains the provided **alt** name |
