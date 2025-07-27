// استدعاء العناصر
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');

// تهيئة Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, alpha: true });
renderer.setSize(400, 400);

// إنشاء رأس كرتوني (مجسم كرة + عيون + فم)
const headGroup = new THREE.Group();

// رأس (كرة)
const headGeometry = new THREE.SphereGeometry(1, 32, 32);
const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa, wireframe: false });
const headMesh = new THREE.Mesh(headGeometry, headMaterial);
headGroup.add(headMesh);

// عيون (كرات صغيرة)
const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
leftEye.position.set(-0.35, 0.3, 0.9);
headGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
rightEye.position.set(0.35, 0.3, 0.9);
headGroup.add(rightEye);

// فم (مستطيل صغير)
const mouthGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.05);
const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
mouth.position.set(0, -0.4, 0.9);
headGroup.add(mouth);

// إضافة الرأس للمشهد
scene.add(headGroup);

// وضع الكاميرا في مكان مناسب
camera.position.z = 3;

// تهيئة MediaPipe FaceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  }
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

// تشغيل الكاميرا مع MediaPipe
const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
cameraUtils.start();

// وظيفة تحدث حركة الرأس الكرتوني بناءً على زوايا الرأس

function onResults(results) {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    return;
  }
  const landmarks = results.multiFaceLandmarks[0];

  // نقاط مهمة لحساب دوران الرأس (مثال مبسط)
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const noseTip = landmarks[1];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];

  // حساب ميل الرأس (تقدير تقريبي)
  // نقارن بين العيون والأنف
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  const angleY = Math.atan2(dy, dx); // دوران يمين ويسار

  // دوران الرأس الكرتوني
  headGroup.rotation.y = angleY * 5; // مضاعفة لزيادة الاستجابة

  // ممكن تضيف دوران X و Z بناءً على بيانات أخرى لو تحب

  renderer.render(scene, camera);
}

// تعيين دالة النتائج لـ faceMesh
faceMesh.onResults(onResults);