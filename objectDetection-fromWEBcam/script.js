document.addEventListener("DOMContentLoaded", async function () {
    console.log("Checking if cocoSsd is loaded...", window.cocoSsd);

    if (typeof cocoSsd === "undefined") {
        console.error("🚨 cocoSsd is not defined! Check your script imports in index.html.");
        return;
    }

    // Load dependencies
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Set up webcam stream
    async function setupCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
        });
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(video);
        });
    }

    // Load the COCO-SSD model
    async function loadModel() {
        console.log("Loading COCO-SSD model...");
        return await cocoSsd.load();
    }

    // Draw detected objects
    function drawDetections(predictions) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            ctx.strokeStyle = "lime";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            ctx.fillStyle = "lime";
            ctx.font = "16px Arial";
            ctx.fillText(`${prediction.class} (${(prediction.score * 100).toFixed(1)}%)`, x, y > 20 ? y - 5 : y + 15);
        });
    }

    // Run object detection
    async function detectObjects(model) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        setInterval(async () => {
            if (!model) return;

            const predictions = await model.detect(video);
            drawDetections(predictions);
        }, 100);
    }

    // Initialize application
    await setupCamera();
    const model = await loadModel();
    if (model) {
        detectObjects(model);
    } else {
        console.error("❌ Failed to load COCO-SSD model.");
    }
});
