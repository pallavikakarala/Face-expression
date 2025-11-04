import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import "./App.css";

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [expression, setExpression] = useState("Detecting...");
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setIsModelLoaded(true);
      startVideo();
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          // Use a function callback to ensure the stream is set
          videoRef.current.srcObject = stream; 
        }
      })
      .catch((err) => console.error("Camera access error:", err));
  };

  useEffect(() => {
    if (!isModelLoaded) return;
    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) { // Ensure video is ready
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections.length > 0) {
          const expr = detections[0].expressions;
          const mainExpression = Object.keys(expr).reduce((a, b) =>
            expr[a] > expr[b] ? a : b
          );
          setExpression(mainExpression.charAt(0).toUpperCase() + mainExpression.slice(1)); // Capitalize
        } else {
          setExpression("No face detected");
        }

        const canvas = canvasRef.current;
        
        // **********************************************
        // *** FIX: Use offsetWidth/Height for scaling ***
        // **********************************************
        const displaySize = {
          width: videoRef.current.offsetWidth,    // Actual rendered width on screen
          height: videoRef.current.offsetHeight,  // Actual rendered height on screen
        };
        
        // This line is now crucial, as it matches the canvas size to the CSS-managed video size.
        faceapi.matchDimensions(canvas, displaySize);
        
        // Resize detection results to match the display size
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Clear and draw
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }
    }, 100); // Increased frequency for smoother tracking
    return () => clearInterval(interval);
  }, [isModelLoaded]);

  return (
    <div className="container">
      <h1>🤖 Face Expression Detector</h1>
      <div className="video-container">
        {/* REMOVED fixed width="640" height="480" to let CSS handle sizing */}
        <video ref={videoRef} autoPlay muted />
        <canvas ref={canvasRef} className="overlay" />
      </div>
      <h2>
        Detected Expression: <span className="expression">{expression}</span>
      </h2>
    </div>
  );
};

export default App;