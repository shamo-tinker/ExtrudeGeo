import "./App.css";
import * as THREE from "three";
import { Extrude, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";
import { Point } from "fabric/fabric-impl";

function App() {
  const [rectWidth, setRectWidth] = useState(150);
  const [rectHeight, setRectHeight] = useState(150);
  const defaultRectangle = new THREE.Shape();
  defaultRectangle.moveTo(-40, -40);
  defaultRectangle.lineTo(40, -40);
  defaultRectangle.lineTo(40, 40);
  defaultRectangle.lineTo(-40, 40);
  defaultRectangle.lineTo(-40, -40);
  const [currentRectangle, setCurrentRectangle] = useState(defaultRectangle);
  const [canvas, setCanvas] = useState(null);
  const canvasRef = useRef(null);
  const initCanvas = () =>
    new fabric.Canvas("c", {
      width: window.innerWidth / 2,
      height: window.innerHeight / 2,
      backgroundColor: "#aaaaaa",
    });

  const calcRectPoints = (width: number, height: number) => {
    return [
      {
        x: 0,
        y: 0,
      },
      {
        x: width,
        y: 0,
      },
      {
        x: width,
        y: height,
      },
      {
        x: 0,
        y: height,
      },
    ];
  };

  const origin = [
    {
      x: 3,
      y: 4,
    },
    {
      x: 16,
      y: 3,
    },
    {
      x: 30,
      y: 5,
    },
    {
      x: 25,
      y: 55,
    },
    {
      x: 19,
      y: 44,
    },
    {
      x: 15,
      y: 30,
    },
    {
      x: 15,
      y: 55,
    },
    {
      x: 9,
      y: 55,
    },
    {
      x: 6,
      y: 53,
    },
    {
      x: -2,
      y: 55,
    },
    {
      x: -4,
      y: 40,
    },
    {
      x: 0,
      y: 20,
    },
  ];
  let polygon = new fabric.Polygon(calcRectPoints(rectWidth, rectHeight), {
    left: innerWidth / 4 - rectWidth / 2,
    top: innerHeight / 4 - rectHeight / 2,
    fill: "transparent",
    strokeWidth: 1,
    stroke: "black",
    scaleX: 1,
    scaleY: 1,
    objectCaching: false,
    transparentCorners: false,
    cornerColor: "blue",
  });

  // define a function that can locate the controls.
  // this function will be used both for drawing and for interaction.
  function polygonPositionHandler(dim, finalMatrix, fabricObject) {
    var x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
      y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
    return fabric.util.transformPoint(
      { x: x, y: y },
      fabric.util.multiplyTransformMatrices(
        fabricObject.canvas.viewportTransform,
        fabricObject.calcTransformMatrix()
      )
    );
  }

  function getObjectSizeWithStroke(object) {
    var stroke = new fabric.Point(
      object.strokeUniform ? 1 / object.scaleX : 1,
      object.strokeUniform ? 1 / object.scaleY : 1
    ).multiply(object.strokeWidth);
    return new fabric.Point(object.width + stroke.x, object.height + stroke.y);
  }
  // define a function that will define what the control does
  // this function will be called on every mouse move after a control has been
  // clicked and is being dragged.
  // The function receive as argument the mouse event, the current trasnform object
  // and the current position in canvas coordinate
  // transform.target is a reference to the current object being transformed,
  function actionHandler(eventData, transform, x, y) {
    var polygon = transform.target,
      currentControl = polygon.controls[polygon.__corner],
      mouseLocalPosition = polygon.toLocalPoint(
        new fabric.Point(x, y),
        "center",
        "center"
      ),
      polygonBaseSize = getObjectSizeWithStroke(polygon),
      size = polygon._getTransformedDimensions(0, 0),
      finalPointPosition = {
        x:
          (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
          polygon.pathOffset.x,
        y:
          (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
          polygon.pathOffset.y,
      };
    polygon.points[currentControl.pointIndex] = finalPointPosition;
    return true;
  }

  // define a function that can keep the polygon in the same position when we change its
  // width/height/top/left.
  function anchorWrapper(anchorIndex, fn) {
    return function (eventData, transform, x, y) {
      var fabricObject = transform.target,
        absolutePoint = fabric.util.transformPoint(
          {
            x: fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
            y: fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y,
          },
          fabricObject.calcTransformMatrix()
        ),
        actionPerformed = fn(eventData, transform, x, y),
        newDim = fabricObject._setPositionDimensions({}),
        polygonBaseSize = getObjectSizeWithStroke(fabricObject),
        newX =
          (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) /
          polygonBaseSize.x,
        newY =
          (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) /
          polygonBaseSize.y;
      fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
      return actionPerformed;
    };
  }

  function Edit() {
    // clone what are you copying since you
    // may want copy and paste on different moment.
    // and you do not want the changes happened
    // later to reflect on the copy.
    var poly = canvas.getObjects()[0];
    canvas.setActiveObject(poly);
    poly.edit = !poly.edit;
    if (poly.edit) {
      var lastControl = poly.points.length - 1;
      poly.cornerStyle = "circle";
      poly.cornerColor = "rgba(0,0,255,0.5)";
      poly.controls = poly.points.reduce(function (acc, point, index) {
        acc["p" + index] = new fabric.Control({
          positionHandler: polygonPositionHandler,
          actionHandler: anchorWrapper(
            index > 0 ? index - 1 : lastControl,
            actionHandler
          ),
          actionName: "modifyPolygon",
          pointIndex: index,
        });
        return acc;
      }, {});
    } else {
      poly.cornerColor = "blue";
      poly.cornerStyle = "rect";
      poly.controls = fabric.Object.prototype.controls;
    }
    poly.hasBorders = !poly.edit;
    canvas.requestRenderAll();
  }

  useEffect(() => {
    const canvas = initCanvas();
    setCanvas(canvas);
    canvas.add(polygon);
    canvas.setActiveObject(polygon);
  }, []);

  const Reshape = () => {
    const updatedPoint = canvas.getObjects()[0].points;
    console.log("Updated Position of the point", updatedPoint);
    const updatedRectangle = new THREE.Shape();
    updatedRectangle.moveTo(updatedPoint[0].x, updatedPoint[0].y);
    updatedRectangle.lineTo(updatedPoint[1].x, updatedPoint[1].y);
    updatedRectangle.lineTo(updatedPoint[2].x, updatedPoint[2].y);
    updatedRectangle.lineTo(updatedPoint[3].x, updatedPoint[3].y);
    updatedRectangle.lineTo(updatedPoint[0].x, updatedPoint[0].y);
    setCurrentRectangle(updatedRectangle);
  };

  const UpdateRectangle = () => {
    canvas.requestRenderAll();
    canvas.renderAll();
    canvas.renderAll.bind(canvas);
    console.log("123", polygon.points);
  };
  function ExtrudedModel() {
    const extrudeSettings = { steps: 2, depth: 5, bevelEnabled: false };
    return (
      <>
        <Extrude args={[currentRectangle, extrudeSettings]}></Extrude>
      </>
    );
  }
  return (
    <>
      <h1>This is a demo app for Geometry Extrude</h1>
      <div>
        <div>
          <span>Width: </span>
          <input
            value={rectWidth}
            onChange={(e) => {
              setRectWidth(Number(e.target.value));
              console.log("origin", polygon.points);
              console.log("new", calcRectPoints(rectWidth, rectHeight));
              const pt = calcRectPoints(rectWidth, rectHeight);
              polygon.points?.forEach((point, index) => {
                polygon.points[index] = pt[index];
              });
              console.log("chanaged", polygon.points);
            }}
          ></input>
        </div>
        <div>
          <span>height: </span>
          <input
            value={rectHeight}
            onChange={(e) => {
              setRectHeight(Number(e.target.value));
            }}
          ></input>
        </div>
        <button onClick={() => UpdateRectangle()}>Update Rectangle</button>
        <button onClick={() => Edit()}>Edit Button</button>
        <button onClick={() => Reshape()}> Reshape Object</button>
      </div>
      <div>
        <canvas id="c" ref={canvasRef} />
      </div>
      <Canvas
        style={{
          width: window.innerWidth / 2,
          height: window.innerHeight / 2,
          backgroundColor: "grey",
        }}
        camera={{ position: [-20, 10, 20] }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.3} />
        <ExtrudedModel />
        <OrbitControls />
        <gridHelper />
      </Canvas>
    </>
  );
}

export default App;
