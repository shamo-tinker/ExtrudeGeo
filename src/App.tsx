import "./App.css";
import * as THREE from "three";
import { Extrude, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";

function App() {
  const [rectWidth, setRectWidth] = useState(100);
  const [rectHeight, setRectHeight] = useState(100);
  const [depth, setDepth] = useState(100);
  const defaultRectangle = new THREE.Shape();
  defaultRectangle.moveTo(-40, -40);
  defaultRectangle.lineTo(40, -40);
  defaultRectangle.lineTo(40, 40);
  defaultRectangle.lineTo(-40, 40);
  defaultRectangle.lineTo(-40, -40);
  const [currentRectangle, setCurrentRectangle] = useState(defaultRectangle);
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | undefined>();
  const initCanvas = () =>
    new fabric.Canvas("c", {
      width: 500,
      height: 500,
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

  let polygon = new fabric.Polygon(calcRectPoints(rectWidth, rectHeight), {
    left: 250 - rectWidth / 2,
    top: 250 - rectHeight / 2,
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
    const _canvas = initCanvas();
    setCanvas(_canvas);
  }, []);

  const PlaceRectangle = () => {
    canvas?.add(polygon);
    canvas?.setActiveObject(polygon);
    canvas?.requestRenderAll();
  };

  const UpdateRectangle = () => {
    const obj = canvas?.getActiveObject();
    console.log(obj);
    const newPos = calcRectPoints(rectWidth, rectHeight);
    obj?.set({
      width: rectWidth,
      height: rectHeight,
      points: newPos,
    });

    canvas?.requestRenderAll();
  };
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

  function ExtrudedModel() {
    const extrudeSettings = { steps: 1, depth: depth, bevelEnabled: false };
    return (
      <>
        <Extrude args={[currentRectangle, extrudeSettings]}></Extrude>
      </>
    );
  }
  return (
    <div>
      <h2>This is a demo app for Geometry Extrude</h2>
      <div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          <div>
            <span>Width: </span>
            <input
              value={rectWidth}
              onChange={(e) => {
                setRectWidth(Number(e.target.value));
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
          <div>
            <span>Depth: </span>
            <input
              value={depth}
              onChange={(e) => {
                setDepth(Number(e.target.value));
              }}
            ></input>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 30,
            marginBottom: 30,
            gap: 20,
          }}
        >
          <button
            style={{ backgroundColor: "#155CA2", color: "white" }}
            onClick={() => PlaceRectangle()}
          >
            Place Rectangle
          </button>
          <button
            style={{ backgroundColor: "#155CA2", color: "white" }}
            onClick={() => UpdateRectangle()}
          >
            Update Rectangle
          </button>
          <button
            style={{ backgroundColor: "#155CA2", color: "white" }}
            onClick={() => Edit()}
          >
            Edit Button
          </button>
          <button
            style={{ backgroundColor: "#155CA2", color: "white" }}
            onClick={() => Reshape()}
          >
            {" "}
            Reshape Object
          </button>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <canvas id="c" ref={canvasRef} />
        <Canvas
          style={{
            width: 500,
            height: 500,
            backgroundColor: "grey",
          }}
          camera={{ position: [-200, 200, 200] }}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.3} />
          <ExtrudedModel />
          <OrbitControls />
          <gridHelper args={[250, 250]} />
        </Canvas>
      </div>
    </div>
  );
}

export default App;
