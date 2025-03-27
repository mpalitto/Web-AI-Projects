document.addEventListener("DOMContentLoaded", async function () {
    console.log("Initializing object detection...");

    // Get elements
    const mjpegStream = document.getElementById("mjpeg-stream");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Set fixed dimensions to match 240x240 stream
    canvas.width = 240;
    canvas.height = 240;
    mjpegStream.width = 240;
    mjpegStream.height = 240;

    // Debug stream loading
    mjpegStream.onerror = function(err) {
        console.error("Stream error:", err);
    };

    // Load model
    async function loadModel() {
        console.log("Loading COCO-SSD model...");
        try {
            const model = await cocoSsd.load();
            console.log("Model loaded successfully");
            return model;
        } catch (error) {
            console.error("Model loading failed:", error);
            return null;
        }
    }

    // Detection function with scaling for small image
    async function detectObjects(model) {
        if (!model) return;

        try {
            // Run detection
            const predictions = await model.detect(mjpegStream);
            
            // Clear previous detections
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw new detections
            predictions.forEach(prediction => {
                const [x, y, width, height] = prediction.bbox;
                
                // Draw bounding box
                ctx.strokeStyle = "lime";
                ctx.lineWidth = 2;  // Thinner line for small image
                ctx.strokeRect(x, y, width, height);

                // Draw label
                ctx.fillStyle = "lime";
                ctx.font = "10px Arial";  // Smaller font for small image
                ctx.fillText(
                    `${prediction.class} (${(prediction.score * 100).toFixed(0)}%)`,
                    x, 
                    y > 10 ? y - 5 : y + 10
                );
            });

            if (predictions.length > 0) {
                console.log("Detected:", predictions.map(p => p.class));
            }
        } catch (error) {
            console.error("Detection error:", error);
        }
    }

    // Main initialization
    try {
        // Verify stream is loading
        await new Promise((resolve) => {
            mjpegStream.onload = resolve;
            // Fallback in case stream is already loaded
            if (mjpegStream.complete) resolve();
        });

        console.log("Stream loaded, dimensions:", 
                   mjpegStream.naturalWidth, mjpegStream.naturalHeight);

        // Load model and start detection
        const model = await loadModel();
        if (model) {
            // Run detection every 500ms (adjust as needed)
            setInterval(() => detectObjects(model), 500);
        }
    } catch (error) {
        console.error("Initialization failed:", error);
    }
});