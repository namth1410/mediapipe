import React, { useEffect, useRef, useState } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

const PoseDetectionApp = () => {
  const demosSectionRef = useRef(null);
  const enableWebcamButtonRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [runningMode, setRunningMode] = useState("IMAGE");
  const [webcamRunning, setWebcamRunning] = useState(false);

  useEffect(() => {
    const createPoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );

      const newPoseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: "GPU",
        },
        runningMode: runningMode,
        numPoses: 2,
      });

      setPoseLandmarker(newPoseLandmarker);
      demosSectionRef.current.classList.remove("invisible");
    };

    createPoseLandmarker();
  }, [runningMode]);

  //   const handleClick = async (event) => {
  //     if (!poseLandmarker) {
  //       console.log("Wait for poseLandmarker to load before clicking!");
  //       return;
  //     }

  //     if (runningMode === "VIDEO") {
  //       setRunningMode("IMAGE");
  //       await poseLandmarker.setOptions({ runningMode: "IMAGE" });
  //     }

  //     const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
  //     for (let i = allCanvas.length - 1; i >= 0; i--) {
  //       const n = allCanvas[i];
  //       n.parentNode.removeChild(n);
  //     }

  //     poseLandmarker.detect(event.target, (result) => {
  //       const canvas = document.createElement("canvas");
  //       canvas.setAttribute("class", "canvas");
  //       canvas.setAttribute("width", event.target.naturalWidth + "px");
  //       canvas.setAttribute("height", event.target.naturalHeight + "px");
  //       canvas.style = `left: 0px; top: 0px; width: ${event.target.width}px; height: ${event.target.height}px;`;

  //       event.target.parentNode.appendChild(canvas);
  //       const canvasCtx = canvas.getContext("2d");
  //       const drawingUtils = new DrawingUtils(canvasCtx);
  //       for (const landmark of result.landmarks) {
  //         drawingUtils.drawLandmarks(landmark, {
  //           radius: (data) => DrawingUtils.lerp(data.from?.z, -0.15, 0.1, 5, 1),
  //         });
  //         drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
  //       }
  //     });
  //   };

  const enableCam = () => {
    if (!poseLandmarker) {
      console.log("Wait! poseLandmaker not loaded yet.");
      return;
    }

    if (webcamRunning) {
      setWebcamRunning(false);
      enableWebcamButtonRef.current.innerText = "ENABLE PREDICTIONS";
    } else {
      setWebcamRunning(true);
      enableWebcamButtonRef.current.innerText = "DISABLE PREDICTIONS";
    }

    const constraints = {
      video: true,
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener("loadeddata", predictWebcam);
    });
  };

  let lastVideoTime = -1;

  const predictWebcam = () => {
    canvasRef.current.style.height = "360px";
    videoRef.current.style.height = "360px";
    canvasRef.current.style.width = "480px";
    videoRef.current.style.width = "480px";

    if (runningMode === "IMAGE") {
      setRunningMode("VIDEO");
      poseLandmarker.setOptions({ runningMode: "VIDEO" });
    }

    let startTimeMs = performance.now();

    if (lastVideoTime !== videoRef.current.currentTime) {
      lastVideoTime = videoRef.current.currentTime;
      if (
        enableWebcamButtonRef.current.innerText === "DISABLE PREDICTIONS" &&
        videoRef.current.videoWidth > 0 &&
        videoRef.current.videoHeight > 0
      ) {
        poseLandmarker.detectForVideo(
          videoRef.current,
          startTimeMs,
          (result) => {
            canvasRef.current.getContext("2d").save();
            canvasRef.current
              .getContext("2d")
              .clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
              );
            const drawingUtils = new DrawingUtils(
              canvasRef.current.getContext("2d")
            );
            console.log(result);
            for (const landmark of result.landmarks) {
              drawingUtils.drawLandmarks(landmark, {
                radius: (data) =>
                  DrawingUtils.lerp(data.from?.z, -0.15, 0.1, 5, 1),
              });
              drawingUtils.drawConnectors(
                landmark,
                PoseLandmarker.POSE_CONNECTIONS
              );
            }
            canvasRef.current.getContext("2d").restore();
          }
        );
      }
    }

    if (webcamRunning) {
      window.requestAnimationFrame(predictWebcam);
    }
  };

  return (
    <div>
      <section id="demos" ref={demosSectionRef} className="invisible">
        <div id="liveView" className="videoView">
          <button
            id="webcamButton"
            className="mdc-button mdc-button--raised"
            onClick={enableCam}
            ref={enableWebcamButtonRef}
          >
            <span className="mdc-button__ripple"></span>
            <span className="mdc-button__label">ENABLE WEBCAM</span>
          </button>
          <div style={{ position: "relative" }}>
            <video
              id="webcam"
              style={{
                width: "1280px",
                height: "720px",
                position: "absolute",
                left: "0px",
                top: "0px",
              }}
              autoPlay
              playsInline
              ref={videoRef}
            ></video>
            <canvas
              className="output_canvas"
              id="output_canvas"
              width="1280"
              height="720"
              style={{ position: "absolute", left: "0px", top: "0px" }}
              ref={canvasRef}
            ></canvas>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PoseDetectionApp;
