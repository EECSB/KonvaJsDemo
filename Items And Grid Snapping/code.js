//Global variables///////////////////////////////

let app;

/////////////////////////////////////////////////


//Main///////////////////////////////////////////

//Run this when the HTML gets loaded.
window.onload = () => {
  let settings = {
    containerSizeX: 1000, 
    containerSizeY: 700, 
    blockSnapSize: 20,
    draggable: false //enable this if you want to be able to drag the canvas around.
  };

  //Make an instance of the app.
  app = new KonvaDemoApp(settings);
}

/////////////////////////////////////////////////


//Code///////////////////////////////////////////

class KonvaDemoApp{

  //Initialize///////////////////////////////////////

  constructor(settings){
    //Add settings.
    this.settings = settings;

    //No currently selected item.
    this.selectedItem = null;

    //Initialize container.
    this.stage = this.makeContainer();

    //Draw background grid. (stage ref., dots or lines, block snap size)
    this.drawGrid("lines");

    //Add the layer for the items.
    let itemLayer = new Konva.Layer({id:"itemLayer"});
    //Add the new layer.
    this.stage.add(itemLayer);

    //Register toolbar controls events.
    this.registerControls();
  }

  //////////////////////////////////////////////////


  //////////////////////////////////////////////////

  makeContainer(){
    return new Konva.Stage({
      container: "container",
      width: this.settings.containerSizeX, 
      height: this.settings.containerSizeY,
      x:0,
      y:0,
      scaleX:1,
      scaleY:1,
      draggable: this.settings.draggable
    });
  }

  drawGrid(gridType){

    //Make a new layer for the grid.
    let gridLayer = new Konva.Layer({id:"grid"});

    const padding = this.settings.blockSnapSize;

    //Grid size.
    const height = this.stage.attrs.height*15;
    const width = this.stage.attrs.width*15;

    if(gridType == "dottedLines"){
      //Draw dotted lines for background to improve performance vs drawing dots as individual objects.
      for(var i = /*-(width / padding)*/0; i < width / padding; i++){
        gridLayer.add(new Konva.Line({
          points: [Math.round(i * padding) + 0.5, 0, Math.round(i * padding) + 0.5, height],
          stroke: "#000",
          strokeWidth: 3,
          name: "backgroundLine",
          lineCap: "round",
          lineJoin: "round",
          dash: [ 0, this.settings.blockSnapSize, 0, this.settings.blockSnapSize ]
        }));
      }

      gridLayer.add(new Konva.Line({points: [0,0,10,10]}));
    }

    /*
    //Draw dots as individual objects.
    if(gridType == "dots"){
        //Draw dots for backgrouond.
        for(var i = 0; i < width1 / padding; i++){
            for(var j = 0; j < height1 / padding; j++){
                gridLayer.add(new Konva.Circle({
                    x: Math.round(i * padding),
                    y: Math.round(j * padding),
                    stroke: "#000",
                    strokeWidth: 0,
                    fill: "#000",
                    radius: 1,
                    name: "backgroundDot"
                }));
            }
        }
    }
    */
    
    if(gridType == "lines"){
      //Draw lines for backgrouond.
      for(var i = 0; i < width / padding; i++){
        gridLayer.add(new Konva.Line({
          points: [Math.round(i * padding) + 0.5, 0, Math.round(i * padding) + 0.5, height],
          stroke: "#000",
          strokeWidth: 0.5,
          name: "backgroundLine"
        }));
      }

      gridLayer.add(new Konva.Line({points: [0,0,10,10]}));

      for(var j = 0; j < height / padding; j++){
        gridLayer.add(new Konva.Line({
          points: [0, Math.round(j * padding), width, Math.round(j * padding)],
          stroke: "#000",
          strokeWidth: 0.5,
          name: "backgroundLine"
        }));
      }
    }

    //Add layer to stage.
    this.stage.add(gridLayer);

    if(this.stage.find("Layer").length > 1) //Another layer must be present in stage to be able to use setZIndex().
      gridLayer.setZIndex(0); //Will be above any lower numbered layers.

  }

  /////////////////////////////////////////////////


  //Feature specific functions/////////////////////

  addItem(x, y, width, height){
    //Make the width/height fit(match) the grid.
    width = this.settings.blockSnapSize * width;
    height = this.settings.blockSnapSize * height

    //Add a new rectangle.
    let rectangle = this.newRectangle(0, 0,  width, height);
    //Add a snap location indicator rectangle for the new rectangle.
    let snapLocationRectangle = this.newSnapLocationRectangle(x, y, width, height);

    //Make item group.
    let item = new Konva.Group({name: "itemGroup"}); 
    item.add(rectangle);
    item.add(snapLocationRectangle);

    //Add snapLocationRectangle to a new layer.
    this.stage.find("#itemLayer")[0].add(item);
  }

  newSnapLocationRectangle(x, y, width, height){
    let snapRect = new Konva.Rect({
      name: "snapLocationRectangle",
      x: x,
      y: y,
      width: width,
      height: height,
      fill: "#26dd02",
      opacity: 0.7,
      stroke: "#168201",
      strokeWidth: 4
    });
    
    //Keep the snap location rectangle hidden by default.
    snapRect.hide();

    return snapRect;
  }
  
  newRectangle(x, y, width, height) {
    //Make new object.
    let rectangle = new Konva.Rect({
      x: x,
      y: y,
      width: width,
      height: height,
      fill: "#fff",
      stroke: "#ddd",
      strokeWidth: 1,
      shadowColor: "black",
      shadowBlur: 2,
      shadowOffset: { x : 1, y : 1 },
      shadowOpacity: 0.4,
      draggable: true
    });

    //Events////////////////////////////////////////////
    
    //When the object dragging starts show snap location, then move the object on top.
    rectangle.on("dragstart", (event) => {
      event.currentTarget.parent.find(".snapLocationRectangle").forEach((shape) => shape.show());
      event.currentTarget.moveToTop();

      this.stage.batchDraw();
    });
    
    //When moving stops snap item to grid and hide snap location item. 
    rectangle.on("dragend", (event) => {

      event.currentTarget.position({
        x: Math.round(rectangle.x() / this.settings.blockSnapSize) * this.settings.blockSnapSize,
        y: Math.round(rectangle.y() / this.settings.blockSnapSize) * this.settings.blockSnapSize
      });

      this.stage.batchDraw();
      event.currentTarget.parent.find(".snapLocationRectangle").forEach((shape) => shape.hide());
    });
    
    //On move snap location indication rectangle.
    rectangle.on("dragmove", (event) => {
      event.currentTarget.parent.find(".snapLocationRectangle").forEach((shape) => shape.position({
        x: Math.round(rectangle.x() / this.settings.blockSnapSize) * this.settings.blockSnapSize,
        y: Math.round(rectangle.y() / this.settings.blockSnapSize) * this.settings.blockSnapSize
      }));

      this.stage.batchDraw();
    });

    //On item click set it as the selected item.
    rectangle.on("click", (event) => {
      this.selectedItem = rectangle;
    });

    ///////////////////////////////////////////////////////

    return rectangle;
  }

  /////////////////////////////////////////////////


  //Events/////////////////////////////////////////

  registerControls(){
    //Grid selection.
    document.getElementById("backgroundSelection").addEventListener("change", (event) => {
      //Clear current grid.
      this.stage.find("#grid")[0].destroy();
      //Draw grid with lines.
      this.drawGrid(event.target.value);
      //Redraw stage.
      this.stage.draw();
    });

    //Delete selected item.
    document.addEventListener('keydown', (event) => {
      if(event.keyCode == 46){
        this.selectedItem.destroy();
        this.selectedItem = null;
        this.stage.batchDraw();
      }
    });

    //Add item.
    document.getElementById("add").addEventListener("click", (event) => {
      //Add item.
      this.addItem(0, 0, 6, 3);
      //Redraw stage.
      this.stage.draw();
    });
  }

  /////////////////////////////////////////////////
}
