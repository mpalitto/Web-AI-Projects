document.addEventListener("DOMContentLoaded", async function () {
    console.log("Checking if poseDetection is loaded...", window.poseDetection);

    if (typeof poseDetection === "undefined") {
        console.error("\ud83d\udea8 poseDetection is not defined! Check your script imports in index.html.");
        return;
    }

    // Load dependencies
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Define keypoint pairs for drawing skeleton
    const keypointPairs = [
        [0, 1], [0, 2], [1, 3], [2, 4], // Face
        [5, 6], [5, 7], [6, 8], [7, 9], [8, 10], // Arms
        [5, 9], [6, 10], [9, 11], [10, 12], // Torso
        [11, 13], [12, 14], [13, 15], [14, 16] // Legs
    ];

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

    // Load MoveNet model
    async function loadModel() {
        console.log("Loading MoveNet model...");
        return await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
    }

    // Draw detected keypoints and skeleton
    function drawKeypointsAndSkeleton(keypoints) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw keypoints
        keypoints.forEach((keypoint) => {
            if (keypoint.score > 0.3) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = "red";
                ctx.fill();
            }
        });

        // Draw skeleton
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
        keypointPairs.forEach(([start, end]) => {
            const kp1 = keypoints[start];
            const kp2 = keypoints[end];

            if (kp1.score > 0.3 && kp2.score > 0.3) {
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        });
    }

    // Run pose detection
    async function detectPose(detector) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        setInterval(async () => {
            if (!detector) return;

            const poses = await detector.estimatePoses(video);
            if (poses.length > 0) {
                drawKeypointsAndSkeleton(poses[0].keypoints);
            }
        }, 100);
    }

    // Set up backend
    async function setupBackend() {
        await tf.setBackend("webgl"); // Use WebGL for acceleration
        await tf.ready();
    }

    // Initialize application
    await setupBackend();
    await setupCamera();
    const detector = await loadModel();
    if (detector) {
        detectPose(detector);
    } else {
        console.error("\u274c Failed to load MoveNet detector.");
    }
});
