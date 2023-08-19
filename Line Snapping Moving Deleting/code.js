//Global variables///////////////////////////////

let app;

/////////////////////////////////////////////////


//Functions//////////////////////////////////////

function registerControls(){
  //Grid selection.
  document.getElementById("backgroundSelection").addEventListener("change", (event) => {
    //Clear current grid.
    app.stage.find("#grid")[0].destroy();
    //Draw grid with lines.
    app.drawGrid(event.target.value);
    //Redraw stage.
    app.stage.draw();
  });
}

function setTool(eventArgs){
  app.action = eventArgs.target.id;
}

function angleSnapping(eventArgs){
  app.angleSnapping = eventArgs.target.checked;
}

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

  //Initialize/////////////////////////////////////

  constructor(settings){
    //Add settings.
    this.settings = settings;

    //No currently selected item.
    this.selectedItem = null;

    //Initialize container.
    this.stage = this.makeContainer();

    this.action = "drawLine";
    this.lineStatus = "start";
    this.angleSnapping = false;
    this.lineStartX = 0;
    this.lineStartY = 0;

    this.registerStageEvents(this.stage);

    //Draw background grid. (stage ref., dots or lines, block snap size)
    this.drawGrid("lines");

    //Add the layer for the items.
    let itemLayer = new Konva.Layer({id:"itemLayer"});
    //Add the new layer.
    this.stage.add(itemLayer);

    //Register toolbar controls events.
    registerControls();
  }

  /////////////////////////////////////////////////

  
  /////////////////////////////////////////////////

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


  //Helper functions///////////////////////////////

  getScaledPointerPosition(){
    const pointerPosition = this.stage.getPointerPosition();
    const stageAttrs = this.stage.attrs;
    const x = (pointerPosition.x - stageAttrs.x) / stageAttrs.scaleX;
    const y = (pointerPosition.y - stageAttrs.y) / stageAttrs.scaleY;
    return {x: x, y: y};
  }

  snapToGrid(axis){
    return Math.round(axis / this.settings.blockSnapSize) * this.settings.blockSnapSize;
  }

  angleBetweenPoints(p1, p2){
    //Angle in radians.
    //var angleRadians = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    //Angle in degrees.
    let angleDeg = Math.atan2(p1.y - p2.y, p1.x - p2.x) * 180 / Math.PI;
    //Make 360 degree from 180/-180 degree.
    angleDeg = angleDeg + 180
    //Mirror.
    angleDeg = 360 - angleDeg;

    return angleDeg;
  }

  snapToGridAngle(p1, p2){
    let angle = this.angleBetweenPoints(p1, p2);

    let angleSnappedX = p2.x;
    let angleSnappedY = p2.y;

    if(angle > 0 && angle < 90){
        //1. quadrant
        if(angle < 45){
            angleSnappedX = p2.x;
            angleSnappedY = p1.y;
        }else{
            angleSnappedX = p1.x;
            angleSnappedY = p2.y;
        }
    }else if(angle > 90 && angle < 180){
        //2. quadrant
        if(angle < 135){
            angleSnappedX = p1.x;
            angleSnappedY = p2.y;
        }else{
            angleSnappedX = p2.x;
            angleSnappedY = p1.y;
        }
    }else if(angle > 180 && angle < 270){
        //3. quadrant
        if(angle < 225){
            angleSnappedX = p2.x;
            angleSnappedY = p1.y;
        }else{
            angleSnappedX = p1.x;
            angleSnappedY = p2.y;
        }
    }else if(angle > 270 && angle < 360){
        //4. quadrant
        if(angle < 315){
            angleSnappedX = p1.x;
            angleSnappedY = p2.y;
        }else{
            angleSnappedX = p2.x;
            angleSnappedY = p1.y;
        }
    }

    return { x: this.snapToGrid(angleSnappedX), y: this.snapToGrid(angleSnappedY)};
  }

  getLength(x1, y1, x2, y2){
    const distance = Math.sqrt(Math.abs(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2)));
    return distance;
    //return Math.round((distance/this.settings.blockSnapSize)*100);
  }

  MakeID(prefix){
    let i = 0;    
    while(this.stage.find("#"+prefix+i)[0] != undefined && i < 1000){
        if(i > 980)
          console.log("Over " +i+ "of type " +prefix+ "in existance! This might start causing problems soon!");

        i++;
    }
    
    return prefix+i;
  }

  /////////////////////////////////////////////////


  //Event callback functions///////////////////////

  adjustDisplayGroup(){
    //Get current mouse position.
    //pos = stage.getPointerPosition();
    let pos = this.getScaledPointerPosition();

    let pos1 = { x: this.snapToGrid(this.lineStartX), y: this.snapToGrid(this.lineStartY) };
    let pos2 = { x: this.snapToGrid(pos.x), y: this.snapToGrid(pos.y) };

    //Snap to angle.
    if(app.angleSnapping)
      pos2 = this.snapToGridAngle(pos1, pos2);

    //Get array of points for line.
    let p = [ this.snapToGrid(this.lineStartX), this.snapToGrid(this.lineStartY), pos2.x, pos2.y];

    //Get length.
    let length = this.getLength(this.snapToGrid(this.lineStartX), this.snapToGrid(this.lineStartY), pos.x, pos.y);
    //Get angle.
    const angle = this.angleBetweenPoints(pos1, pos2);

    //Get length label.
    let lengthLabel = this.stage.find("#displayLabel")[0];
    //Update label text. BlockSnapSize is 20, lets say each square is 10mm, so divide by 2. 
    lengthLabel.text(Math.trunc(length/2) + "mm " +Math.trunc(angle) + " Deg.");
    //Update label position.
    lengthLabel.position({ x: pos2.x, y: pos2.y });

    //Get display line label.
    let displayLine = this.stage.find("#displayLine")[0];
    //Update display line points.
    displayLine.setPoints(p);       
    
    //Get item layer.
    let layer = this.stage.find("#itemLayer")[0];
    //Redraw layer.
    layer.batchDraw();
  }

  drawLineDisplayGroup(){
    //Get mouse position.
    //pos = stage.getPointerPosition();
    let pos = this.getScaledPointerPosition();

    //Make temp display group.
    let displayGroup = new Konva.Group({
        /*draggable: true*/
        id: "displayGroup"
    });

    //Make display line.
    let displayLine = new Konva.Line({
        points: [this.snapToGrid(pos.x), this.snapToGrid(pos.y)],
        stroke: 'black',
        tension: 1,
        strokeWidth: 6,
        draggable: false,
        id: "displayLine"
    });

    displayGroup.add(displayLine);

    //Make line start point displayCircle.
    let displayCircleStart = new Konva.Circle({
        x: this.snapToGrid(pos.x),
        y: this.snapToGrid(pos.y),
        radius: 7,
        fill: '#34eb5b',
        stroke: 'black',
        strokeWidth: 2,
        draggable: false,
        name: "circle"
    });

    displayGroup.add(displayCircleStart);  
    
    let lengthLabel = new Konva.Text({
      x: 0,
      y: 0,
      text: "",
      fontSize: 20,
      fontFamily: "Calibri",
      fill: "green",
      id: "displayLabel"
    });

    displayGroup.add(lengthLabel);   

    //Save line starting postions.
    this.lineStartX = pos.x;
    this.lineStartY = pos.y;

    //Get main item layer.
    let layer = this.stage.find("#itemLayer")[0];
    //Add current display group to the layer.
    layer.add(displayGroup);
    //Redraw layer.
    layer.draw();

    //Change line status to being drawn.
    this.lineStatus = "drawing";
  }

  addNewLine(){
    //Get mouse position, adjusted for current scalling/zoom.
    let pos = this.getScaledPointerPosition(); //stage.getPointerPosition(); //non adjusted mouse position.
    let layer = this.stage.find("#itemLayer")[0];

    //Snap starting position coordinates to grid.
    let pos1 = { x: this.snapToGrid(this.lineStartX), y: this.snapToGrid(this.lineStartY) };
    //Snap end position coordinates to grid.
    let pos2 = { x: this.snapToGrid(pos.x), y: this.snapToGrid(pos.y) };

    //Snap to angle.
    if(app.angleSnapping)
      pos2 = this.snapToGridAngle(pos1, pos2);

    //Grid snap.
    const p = [this.snapToGrid(this.lineStartX), this.snapToGrid(this.lineStartY), pos2.x, pos2.y];

    //Get length.
    let length = this.getLength(pos1.x, pos1.y, pos2.x, pos2.y);

    //Make sure the line length spans at least one block.
    if(length < this.settings.blockSnapSize){
      this.stage.find("#displayGroup")[0].destroy();
      layer.draw();
      return;
    }

    //Line Group/////////////////////////////////////////////////////////////

    //Make new group for the line and it's endpoint circles.
    let group = new Konva.Group({
        name: "lineGroup"
    });

    //Make line start point circle.
    let circleStart = new Konva.Circle({
        x: pos1.x,
        y: pos1.y,
        radius: 7,
        fill: '#34eb5b',
        stroke: 'black',
        strokeWidth: 2,
        draggable: true,
        name: "circleStart"
    });

    //Make line end point circle.
    let circleEnd = new Konva.Circle({
        x: pos2.x,
        y: pos2.y,
        radius: 7,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 2,
        draggable: true,
        name: "circleEnd"
    });

    //Make drawn line.
    let drawnLine = new Konva.Line({
        points: p,
        tension: 0,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 6,
        draggable: false,
        name: "drawLine",
        id: this.MakeID("drawLine"),
        length: length 
    });

    /////////////////////////////////////////////////////////////////////////

    //Add events.
    circleStart.on('dragmove', this.adjustLineCirclePoint);
    circleEnd.on('dragmove', this.adjustLineCirclePoint);

    //Add to group.
    group.add(drawnLine);
    group.add(circleEnd);
    group.add(circleStart);

    //Event used to delete a line.
    group.on("click", this.groupClicked);

    //Add to layer.
    layer.add(group);

    //Put group on the bottom so line doesn't overlap existing line endpoint circle.
    group.moveToBottom();
  }

  adjustLineCirclePoint(event){  
    if(app.action != "move")
      return;

    //Get mouse position, adjusted for current scalling/zoom.
    let pos = app.getScaledPointerPosition(); //stage.getPointerPosition(); //non adjusted mouse position.

    //Get Line from group.
    let currentLine = event.target.parent.find('.drawLine')[0];
    
    //Snap starting position coordinates to grid.
    let pos1 = { x: currentLine.attrs.points[0], y: currentLine.attrs.points[1] };
    if(event.target.attrs.name == "circleStart")
      pos1 = { x: currentLine.attrs.points[2], y: currentLine.attrs.points[3] };
    
    //Snap end position coordinates to grid.
    let pos2 = { x: app.snapToGrid(pos.x), y: app.snapToGrid(pos.y) };

    //Snap to angle.
    if(app.angleSnapping)
      pos2 = app.snapToGridAngle(pos1, pos2);

    //Get length.
    let length = app.getLength(pos1.x, pos1.y, pos2.x, pos2.y);
    //Do nothing if set length is too short.
    if(length < app.settings.blockSnapSize)
      return;

    //Set the targets x,y to new grid snaped mouse pointer position.  
    event.target.attrs.x = pos2.x;
    event.target.attrs.y = pos2.y;

    let points = [pos1.x, pos1.y, pos2.x, pos2.y];  //Make an array from circle start/end postiotns and assign the new position values array to the line(so that the line will be drawn between the two circles).
    if(event.target.attrs.name == "circleStart")
      points = [pos2.x, pos2.y, pos1.x, pos1.y];  //Make an array from circle start/end postiotns and assign the new position values array to the line(so that the line will be drawn between the two circles). 


    //Set the curently selected line points.    
    currentLine.setPoints(points);
    
    //Get items layer.
    let layer = app.stage.find("#itemLayer")[0];
    //Redraw layer.
    layer.batchDraw();
  }

  groupClicked(event){
    if(app.action != "delete")
      return

    //Get parent layer clicked of item(so we can redraw it after).
    let parentLayer = event.currentTarget.parent;
    //Delete line group and all of its children.
    event.currentTarget.destroy();
    //Redraw layer.
    parentLayer.draw();
  }

  /////////////////////////////////////////////////


  //Events/////////////////////////////////////////

  registerStageEvents(stage){
    //Get container.
    let container = stage.container();

    container.addEventListener('mousedown', function(e) {
        e.preventDefault();

        if(app.action == "drawLine" && app.lineStatus == "start")
          app.drawLineDisplayGroup(); //Draw temporary display group.
    });
    
    container.addEventListener('mouseup', function(e) {
      e.preventDefault();

      if(app.action == "drawLine" && app.lineStatus == "drawing"){
        //Make final line.
        app.addNewLine();
  
        //Delete temp. display elements.
        app.stage.find("#displayGroup")[0].destroy();
        app.stage.find("#itemLayer")[0].draw();

        //Reset line status back to default to enable drawing a new line.
        app.lineStatus = "start";
      }
    });

    container.addEventListener('mousemove', function(e) {
      if(app.lineStatus == "drawing")
        app.adjustDisplayGroup();
    });
  }

  /////////////////////////////////////////////////
}
