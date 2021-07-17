const USE_LINEAR_RAMP = location.search.includes("ramped");

function setupAudio(audioElement) {
  const audioContext = new AudioContext();

  const panner = audioContext.createPanner();
  panner.panningModel = "HRTF";
  panner.refDistance = 50;
  panner.coneInnerAngle = 0;
  panner.coneOuterAngle = 180;
  panner.coneOuterGain = 0.25;

  const source = audioContext.createMediaElementSource(audioElement);
  source.connect(panner);
  panner.connect(audioContext.destination);

  return { listener: audioContext.listener, panner, audioContext };
}

function setupCanvas() {
  canvas.width = 400;
  canvas.height = 400;
  const canvasContext = canvas.getContext("2d");
  canvasContext.textAlign = "center";
  canvasContext.font = "18pt sans-serif";
  canvasContext.fillText("click to play", 200, 200);
  return canvasContext;
}

function drawSemiCircle(canvasContext, x, z, r = 0) {
  canvasContext.beginPath();
  canvasContext.ellipse(x, z, 10, 10, r + Math.PI / 2, 0, Math.PI);
  canvasContext.fill();
}

function main() {
  const pannerTransform = {
    x: 200,
    z: 100,
    r: 0,
  };

  const listenerTransform = {
    x: 200,
    z: 200,
    r: -Math.PI / 2,
  };

  let lastUpdate = 0;

  const canvasElement = document.getElementById("canvas");
  const canvasContext = setupCanvas(canvasElement);

  const audioElement = document.getElementById("audio");
  let listener, panner, audioContext;

  canvasElement.addEventListener(
    "click",
    () => {
      const audio = setupAudio(audioElement);
      listener = audio.listener;
      panner = audio.panner;
      audioContext = audio.audioContext;

      audioElement.play();

      if (audioContext.state === "suspended") {
        audioContext.resume().then(() => {
          requestAnimationFrame(animate);
        });
      } else {
        requestAnimationFrame(animate);
      }
    },
    { once: true }
  );

  const infoElement = document.getElementById("info");

  function animate(time) {
    const delta = time - lastUpdate;
    lastUpdate = time;
    requestAnimationFrame(animate);

    canvasContext.clearRect(0, 0, 400, 400);

    pannerTransform.x = 200 + Math.cos(time / 1000) * 100;
    pannerTransform.z = 200 + Math.sin(time / 1000) * 100;
    pannerTransform.r = time / 550;

    if (USE_LINEAR_RAMP) {
      const endTime = audioContext.currentTime + delta / 1000;
      panner.positionX.linearRampToValueAtTime(pannerTransform.x, endTime);
      panner.positionZ.linearRampToValueAtTime(pannerTransform.z, endTime);
      panner.orientationX.linearRampToValueAtTime(Math.cos(pannerTransform.r), endTime);
      panner.orientationZ.linearRampToValueAtTime(Math.sin(pannerTransform.r), endTime);
    } else {
      panner.setPosition(pannerTransform.x, 0, pannerTransform.z);
      panner.setOrientation(Math.cos(pannerTransform.r), 0, Math.sin(pannerTransform.r));
    }

    drawSemiCircle(canvasContext, pannerTransform.x, pannerTransform.z, pannerTransform.r);

    listenerTransform.x = 200 + Math.cos(time / 2550) * 50;

    listener.setPosition(listenerTransform.x, 0, listenerTransform.z);

    drawSemiCircle(canvasContext, listenerTransform.x, listenerTransform.z, listenerTransform.r);

    const minutes = Math.floor(time / 1000 / 60);
    const seconds = time / 1000 - minutes * 60;
    infoElement.textContent =
      `playing with ${USE_LINEAR_RAMP ? "ramped transform" : "instantaneous transform"} at ` +
      `${minutes.toFixed(0).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
  }
}

main();
