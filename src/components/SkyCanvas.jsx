
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './SkyCanvas.module.css';
import * as SunCalc from "suncalc";




function SkyCanvas({ city }) {
  const mountRef = useRef(null);
  const cityRef = useRef(city);

  useEffect(() => {
    cityRef.current = city;
  }, [city]);

  useEffect(() => {
    let disposed = false;
    let resizeObserver = null;

    // 1. Create the scene
    const scene = new THREE.Scene();

    // 2. Create the camera
    const initialWidth = mountRef.current.clientWidth;
    const initialHeight = window.innerHeight;

    console.log("Initial canvas size:", initialWidth, initialHeight);

    const camera = new THREE.OrthographicCamera(
      -initialWidth / 2,
      initialWidth / 2,
      initialHeight / 2,
      -initialHeight / 2,
      0.1,
      1000
    );

    camera.position.z = 10;

    // 3. Create the renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setSize(initialWidth, initialHeight);

    renderer.setPixelRatio(1);

    mountRef.current.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'pan-y';



    const loadSvg = async () => {
        const response = await fetch('/stars.svg');
        if (disposed) return;
        
        const svgText = await response.text();
        if (disposed) return;
      
        const parser = new DOMParser();
        const svgDocument = parser.parseFromString(
          svgText,
          'image/svg+xml'
        );
      
        const circles = svgDocument.querySelectorAll('circle');


        const particleCount = circles.length;

        const viewBox = svgDocument.documentElement.viewBox.baseVal;

        const svgWidth = viewBox.width;
        const svgHeight = viewBox.height;

        const nightColor = new THREE.Color("#f5f2ff");
        const dayColor = new THREE.Color("#872cfe");

        // Cover the viewport, with a little extra overflow
        let scale = Math.max(
          mountRef.current.clientWidth / svgWidth,
          mountRef.current.clientHeight / svgHeight
        ) * 1.05;

        const pivotIndex = 0;

        const pivotSvgX = parseFloat(circles[pivotIndex].getAttribute('cx'));
        const pivotSvgY = parseFloat(circles[pivotIndex].getAttribute('cy'));

        // Convert SVG coordinates into Three.js coordinates
        let pivotX = (pivotSvgX - viewBox.x - svgWidth / 2) * scale;
        let pivotY = (viewBox.y + svgHeight / 2 - pivotSvgY) * scale;
      
        // Create particle arrays
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        const brightnesses = new Float32Array(particleCount);
      
        const twinkleSpeeds = new Float32Array(particleCount);
        const twinkleOffsets = new Float32Array(particleCount);
      
        // Extract SVG data
        circles.forEach((circle, i) => {
          const i3 = i * 3;
      
          const x = parseFloat(circle.getAttribute('cx'));
          const y = parseFloat(circle.getAttribute('cy'));
          const radius = parseFloat(circle.getAttribute('r'));
          // const color = circle.getAttribute('fill');

          let color = circle.getAttribute('fill');

          if (color.toLowerCase() === '#ff2800') {
            color = '#ffa640';
          }

          const hexColor = new THREE.Color(color);
          
      
          // Centre horizontally and vertically, and flip the Y-axis
          positions[i3] = (x - viewBox.x - svgWidth / 2) * scale;
          positions[i3 + 1] = (viewBox.y + svgHeight / 2 - y) * scale;
          positions[i3 + 2] = 0;

          // Scale particle sizes along with the SVG
          sizes[i] = radius * 2 * scale * renderer.getPixelRatio();
      
          // const hexColor = new THREE.Color(color);
      
          colors[i3] = hexColor.r;
          colors[i3 + 1] = hexColor.g;
          colors[i3 + 2] = hexColor.b;
      
          brightnesses[i] = 1;
      
          twinkleSpeeds[i] = Math.random() * 1.5 + 0.5;
          twinkleOffsets[i] = Math.random() * Math.PI * 2;
        });
        const originalPositions = positions.slice();
        const originalSizes = sizes.slice();

        const mouse = new THREE.Vector2(99999, 99999);

        const updatePointer = (event) => {
          const rect = mountRef.current.getBoundingClientRect();

          mouse.x = event.clientX - rect.left - rect.width / 2;
          mouse.y = rect.height / 2 - (event.clientY - rect.top);
        };
        
        const onPointerUp = () => {
        mouse.set(99999, 99999);
        };
        
        window.addEventListener('pointermove', updatePointer);
        window.addEventListener('pointerdown', updatePointer);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        const influenceRadius = 100;
        const pushStrength = 40;

      
        // Create geometry
        const geometry = new THREE.BufferGeometry();
      
        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(positions, 3)
        );
      
        geometry.setAttribute(
          'size',
          new THREE.BufferAttribute(sizes, 1)
        );
      
        geometry.setAttribute(
          'brightness',
          new THREE.BufferAttribute(brightnesses, 1)
        );
      
        geometry.setAttribute(
          'color',
          new THREE.BufferAttribute(colors, 3)
        );
      
        geometry.setAttribute(
          'twinkleSpeed',
          new THREE.BufferAttribute(twinkleSpeeds, 1)
        );
      
        geometry.setAttribute(
          'twinkleOffset',
          new THREE.BufferAttribute(twinkleOffsets, 1)
        );

        const material = new THREE.ShaderMaterial({
            transparent: true,

            uniforms: {
                uTime: { value: 0 }
            },
        
            vertexShader: `
                attribute float size;
                attribute float brightness;
                attribute float twinkleSpeed;
                attribute float twinkleOffset;
                attribute vec3 color;

                varying float vBrightness;
                varying float vTwinkleSpeed;
                varying float vTwinkleOffset;
                varying vec3 vColor;

                void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = size;

                vBrightness = brightness;
                vTwinkleSpeed = twinkleSpeed;
                vTwinkleOffset = twinkleOffset;
                vColor = color;
                }
            `,
        
            fragmentShader: `
                uniform float uTime;

                varying float vBrightness;
                varying float vTwinkleSpeed;
                varying float vTwinkleOffset;
                varying vec3 vColor;

                void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float distance = length(center);

                float alpha = 1.0 - smoothstep(0.46, 0.5, distance);

                float twinkle = 0.9 + 0.03 * sin(
                    uTime * vTwinkleSpeed + vTwinkleOffset
                );

                alpha *= vBrightness * twinkle;

                gl_FragColor = vec4(vColor, alpha);
                #include <colorspace_fragment>
                }
            `
        });
    

        const particle = new THREE.Points(geometry, material);

        const skyGroup = new THREE.Group();
        skyGroup.add(particle);
        scene.add(skyGroup);

        particle.position.set(-pivotX, -pivotY, 0);
        skyGroup.position.set(pivotX, pivotY, 0);

        // Day sky
        const dayGroup = new THREE.Group();
        scene.add(dayGroup);

        
        // Day sky ambient dots
        const ambientResponse = await fetch('/dayBack4.svg');
        if (disposed) return;

        const ambientSvgText = await ambientResponse.text();
        if (disposed) return;

        const ambientParser = new DOMParser();
        const ambientDocument = ambientParser.parseFromString(
          ambientSvgText,
          'image/svg+xml'
        );

        const ambientCircles = ambientDocument.querySelectorAll('circle');
        const ambientDotCount = ambientCircles.length;

        const ambientViewBox = ambientDocument.documentElement.viewBox.baseVal;

        const ambientSvgWidth = ambientViewBox.width;
        const ambientSvgHeight = ambientViewBox.height;

        // Scale SVG to cover the viewport, with 5% extra overflow
        let ambientScale = Math.max(
          mountRef.current.clientWidth / ambientSvgWidth,
          mountRef.current.clientHeight / ambientSvgHeight
        ) * 1.05;

        // Create particle arrays
        const ambientPositions = new Float32Array(ambientDotCount * 3);
        const ambientSizes = new Float32Array(ambientDotCount);
        const ambientColors = new Float32Array(ambientDotCount * 3);
        const ambientBrightnesses = new Float32Array(ambientDotCount);

        const ambientTwinkleSpeeds = new Float32Array(ambientDotCount);
        const ambientTwinkleOffsets = new Float32Array(ambientDotCount);

        // Extract SVG data
        ambientCircles.forEach((circle, i) => {
          const i3 = i * 3;

          const x = parseFloat(circle.getAttribute('cx'));
          const y = parseFloat(circle.getAttribute('cy'));
          const radius = parseFloat(circle.getAttribute('r'));
          const color = circle.getAttribute('fill');

          const hexColor = new THREE.Color(color);

          // Centre horizontally and vertically, and flip the Y-axis
          ambientPositions[i3] =
            (x - ambientViewBox.x - ambientSvgWidth / 2) * ambientScale;

          ambientPositions[i3 + 1] =
            (ambientViewBox.y + ambientSvgHeight / 2 - y) * ambientScale;

          ambientPositions[i3 + 2] = 0;

          // Preserve SVG particle sizes and scale with the viewport
          ambientSizes[i] =
            radius * 2 * ambientScale * renderer.getPixelRatio();

          ambientColors[i3] = hexColor.r;
          ambientColors[i3 + 1] = hexColor.g;
          ambientColors[i3 + 2] = hexColor.b;

          ambientBrightnesses[i] = 1;

          // No twinkling for now
          ambientTwinkleSpeeds[i] = 0;
          ambientTwinkleOffsets[i] = 0;
        });

        const ambientOriginalPositions = ambientPositions.slice();
        const ambientOriginalSizes = ambientSizes.slice();

        // Create geometry
        const ambientGeometry = new THREE.BufferGeometry();

        ambientGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(ambientPositions, 3)
        );

        ambientGeometry.setAttribute(
          'size',
          new THREE.BufferAttribute(ambientSizes, 1)
        );

        ambientGeometry.setAttribute(
          'brightness',
          new THREE.BufferAttribute(ambientBrightnesses, 1)
        );

        ambientGeometry.setAttribute(
          'color',
          new THREE.BufferAttribute(ambientColors, 3)
        );

        ambientGeometry.setAttribute(
          'twinkleSpeed',
          new THREE.BufferAttribute(ambientTwinkleSpeeds, 1)
        );

        ambientGeometry.setAttribute(
          'twinkleOffset',
          new THREE.BufferAttribute(ambientTwinkleOffsets, 1)
        );

        const ambientParticles = new THREE.Points(
          ambientGeometry,
          material
        );

        dayGroup.add(ambientParticles);
        
        
        // Sun
        const sunResponse = await fetch('/sun.svg');
        if (disposed) return;

        const sunSvgText = await sunResponse.text();
        if (disposed) return;

        const sunParser = new DOMParser();
        const sunDocument = sunParser.parseFromString(
          sunSvgText,
          'image/svg+xml'
        );

        const sunCircles = sunDocument.querySelectorAll('circle');
        const sunDotCount = sunCircles.length;

        const sunViewBox = sunDocument.documentElement.viewBox.baseVal;

        const sunSvgWidth = sunViewBox.width;
        const sunSvgHeight = sunViewBox.height;

        // Make the sun approximately one-third of the viewport height
        let sunScale = (mountRef.current.clientHeight / 2.5) / sunSvgHeight;

        const sunPositions = new Float32Array(sunDotCount * 3);
        const sunSizes = new Float32Array(sunDotCount);
        const sunColors = new Float32Array(sunDotCount * 3);
        const sunBrightnesses = new Float32Array(sunDotCount);

        const sunTwinkleSpeeds = new Float32Array(sunDotCount);
        const sunTwinkleOffsets = new Float32Array(sunDotCount);

        // Extract SVG data
        sunCircles.forEach((circle, i) => {
          const i3 = i * 3;

          const x = parseFloat(circle.getAttribute('cx'));
          const y = parseFloat(circle.getAttribute('cy'));
          const radius = parseFloat(circle.getAttribute('r'));
          const color = circle.getAttribute('fill');

          const hexColor = new THREE.Color(color);

          // Centre the SVG coordinates
          sunPositions[i3] =
            (x - sunViewBox.x - sunSvgWidth / 2) * sunScale;

          sunPositions[i3 + 1] =
            (sunViewBox.y + sunSvgHeight / 2 - y) * sunScale;

          sunPositions[i3 + 2] = 0;

          // Scale particle sizes too
          sunSizes[i] =
            radius * 2 * sunScale * renderer.getPixelRatio();

          sunColors[i3] = hexColor.r;
          sunColors[i3 + 1] = hexColor.g;
          sunColors[i3 + 2] = hexColor.b;

          sunBrightnesses[i] = 1;

          sunTwinkleSpeeds[i] = 0;
          sunTwinkleOffsets[i] = 0;
        });

        const sunOriginalPositions = sunPositions.slice();
        const sunOriginalSizes = sunSizes.slice();

        const sunGeometry = new THREE.BufferGeometry();

        sunGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(sunPositions, 3)
        );

        sunGeometry.setAttribute(
          'size',
          new THREE.BufferAttribute(sunSizes, 1)
        );

        sunGeometry.setAttribute(
          'brightness',
          new THREE.BufferAttribute(sunBrightnesses, 1)
        );

        sunGeometry.setAttribute(
          'color',
          new THREE.BufferAttribute(sunColors, 3)
        );

        sunGeometry.setAttribute(
          'twinkleSpeed',
          new THREE.BufferAttribute(sunTwinkleSpeeds, 1)
        );

        sunGeometry.setAttribute(
          'twinkleOffset',
          new THREE.BufferAttribute(sunTwinkleOffsets, 1)
        );

        const sunParticles = new THREE.Points(
          sunGeometry,
          material
        );

        const sunGroup = new THREE.Group();
        sunGroup.add(sunParticles);
        scene.add(sunGroup);

        // Start in the centre of the screen
        sunGroup.position.set(0, 0, 0);

        
   

        let viewWidth = mountRef.current.clientWidth;
        let viewHeight = mountRef.current.clientHeight;

        let sunHalfWidth = sunSvgWidth * sunScale / 2;

        const resizeScene = () => {
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;

          console.log("Resize canvas size:", width, height);
        
          if (!width || !height) return;
        
          // Camera and renderer
          camera.left = -width / 2;
          camera.right = width / 2;
          camera.top = height / 2;
          camera.bottom = -height / 2;
          camera.updateProjectionMatrix();
        
          renderer.setSize(width, height);
        
          // Night stars
          scale = Math.max(
            width / svgWidth,
            height / svgHeight
          ) * 1.05;
        
          pivotX = (pivotSvgX - viewBox.x - svgWidth / 2) * scale;
          pivotY = (viewBox.y + svgHeight / 2 - pivotSvgY) * scale;
        
          circles.forEach((circle, i) => {
            const i3 = i * 3;
        
            const x = parseFloat(circle.getAttribute('cx'));
            const y = parseFloat(circle.getAttribute('cy'));
            const radius = parseFloat(circle.getAttribute('r'));
        
            positions[i3] = (x - viewBox.x - svgWidth / 2) * scale;
            positions[i3 + 1] = (viewBox.y + svgHeight / 2 - y) * scale;
        
            originalPositions[i3] = positions[i3];
            originalPositions[i3 + 1] = positions[i3 + 1];
        
            sizes[i] = radius * 2 * scale * renderer.getPixelRatio();
            originalSizes[i] = sizes[i];
          });
        
          geometry.attributes.position.needsUpdate = true;
          geometry.attributes.size.needsUpdate = true;
        
          particle.position.set(-pivotX, -pivotY, 0);
          skyGroup.position.set(pivotX, pivotY, 0);
        
          // Day ambient dots
          ambientScale = Math.max(
            width / ambientSvgWidth,
            height / ambientSvgHeight
          ) * 1.05;
        
          ambientCircles.forEach((circle, i) => {
            const i3 = i * 3;
        
            const x = parseFloat(circle.getAttribute('cx'));
            const y = parseFloat(circle.getAttribute('cy'));
            const radius = parseFloat(circle.getAttribute('r'));
        
            ambientPositions[i3] =
              (x - ambientViewBox.x - ambientSvgWidth / 2) * ambientScale;
        
            ambientPositions[i3 + 1] =
              (ambientViewBox.y + ambientSvgHeight / 2 - y) * ambientScale;
        
            ambientOriginalPositions[i3] = ambientPositions[i3];
            ambientOriginalPositions[i3 + 1] = ambientPositions[i3 + 1];
        
            ambientSizes[i] =
              radius * 2 * ambientScale * renderer.getPixelRatio();
        
            ambientOriginalSizes[i] = ambientSizes[i];
          });
        
          ambientGeometry.attributes.position.needsUpdate = true;
          ambientGeometry.attributes.size.needsUpdate = true;
        
          // Sun
          sunScale = (height / 2.5) / sunSvgHeight;
        
          sunCircles.forEach((circle, i) => {
            const i3 = i * 3;
        
            const x = parseFloat(circle.getAttribute('cx'));
            const y = parseFloat(circle.getAttribute('cy'));
            const radius = parseFloat(circle.getAttribute('r'));
        
            sunPositions[i3] =
              (x - sunViewBox.x - sunSvgWidth / 2) * sunScale;
        
            sunPositions[i3 + 1] =
              (sunViewBox.y + sunSvgHeight / 2 - y) * sunScale;
        
            sunOriginalPositions[i3] = sunPositions[i3];
            sunOriginalPositions[i3 + 1] = sunPositions[i3 + 1];
        
            sunSizes[i] =
              radius * 2 * sunScale * renderer.getPixelRatio();
        
            sunOriginalSizes[i] = sunSizes[i];
          });
        
          sunGeometry.attributes.position.needsUpdate = true;
          sunGeometry.attributes.size.needsUpdate = true;
        
          // Update viewport-dependent sun movement
          viewWidth = width;
          viewHeight = height;
          sunHalfWidth = sunSvgWidth * sunScale / 2;
        };
        
        // Observe changes to the actual canvas container
        resizeObserver = new ResizeObserver(resizeScene);
        resizeObserver.observe(mountRef.current);
        
        // Apply the initial dimensions
        resizeScene();


        

        // 4. Animate the scene
        const timer = new THREE.Timer();

        const mouseWorld = new THREE.Vector3();
        const mouseLocal = new THREE.Vector3();
        const ambientMouseLocal = new THREE.Vector3();
        const sunMouseLocal = new THREE.Vector3();

        let skyState = null;

        renderer.setAnimationLoop(() => {
            timer.update();

            const delta = timer.getDelta();
            
            material.uniforms.uTime.value = timer.getElapsed();
            
            // Rotate the stars
            

           

            mouseWorld.set(mouse.x, mouse.y, 0);

            particle.worldToLocal(mouseLocal.copy(mouseWorld));

            const positionsAttribute = geometry.attributes.position;

            for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            const originalX = originalPositions[i3];
            const originalY = originalPositions[i3 + 1];

            const dx = originalX - mouseLocal.x;
            const dy = originalY - mouseLocal.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < influenceRadius) {
                const force = (1 - distance / influenceRadius) * pushStrength;

                positions[i3] = originalX + (dx / distance) * force;
                positions[i3 + 1] = originalY + (dy / distance) * force;
            } else {
                positions[i3] = originalX;
                positions[i3 + 1] = originalY;
            }
            }

            positionsAttribute.needsUpdate = true;

            // Update day ambient dot interaction
            ambientParticles.worldToLocal(
              ambientMouseLocal.copy(mouseWorld)
            );

            const ambientPositionsAttribute =
              ambientGeometry.attributes.position;

            for (let i = 0; i < ambientDotCount; i++) {
              const i3 = i * 3;

              const originalX = ambientOriginalPositions[i3];
              const originalY = ambientOriginalPositions[i3 + 1];

              const dx = originalX - ambientMouseLocal.x;
              const dy = originalY - ambientMouseLocal.y;

              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < influenceRadius && distance > 0) {
                const force = (1 - distance / influenceRadius) * pushStrength;

                ambientPositions[i3] = originalX + (dx / distance) * force;
                ambientPositions[i3 + 1] = originalY + (dy / distance) * force;
              } else {
                ambientPositions[i3] = originalX;
                ambientPositions[i3 + 1] = originalY;
              }
            }

            ambientPositionsAttribute.needsUpdate = true;





            // Update sun dot interaction
            sunParticles.worldToLocal(
              sunMouseLocal.copy(mouseWorld)
            );

            const sunPositionsAttribute =
              sunGeometry.attributes.position;

            for (let i = 0; i < sunDotCount; i++) {
              const i3 = i * 3;

              const originalX = sunOriginalPositions[i3];
              const originalY = sunOriginalPositions[i3 + 1];

              const dx = originalX - sunMouseLocal.x;
              const dy = originalY - sunMouseLocal.y;

              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < influenceRadius && distance > 0) {
                const force = (1 - distance / influenceRadius) * pushStrength;

                sunPositions[i3] = originalX + (dx / distance) * force;
                sunPositions[i3 + 1] = originalY + (dy / distance) * force;
              } else {
                sunPositions[i3] = originalX;
                sunPositions[i3 + 1] = originalY;
              }
            }

            sunPositionsAttribute.needsUpdate = true;

            // Actual solar time
            const now = new Date();
            const currentCity = cityRef.current;

            const solarTimes = SunCalc.getTimes(
              now,
              currentCity.latitude,
              currentCity.longitude
            );

            const dawn = solarTimes.dawn;
            const sunrise = solarTimes.sunrise;
            const sunset = solarTimes.sunset;
            const dusk = solarTimes.dusk;

            let targetStarsVisibility = 1;
            let targetDayVisibility = 0;
            let sunProgress = 0;
            let nightProgress = 0;

            // Sunrise: dawn -> sunrise
            if (now >= dawn && now < sunrise) {
              const progress = (now - dawn) / (sunrise - dawn);
              const transition = progress * progress * (3 - 2 * progress);

              targetStarsVisibility = 1 - transition;
              targetDayVisibility = transition;
            }

            // Day: sunrise -> sunset
            else if (now >= sunrise && now <= sunset) {
              targetStarsVisibility = 0;
              targetDayVisibility = 1;

              sunProgress = (now - sunrise) / (sunset - sunrise);
            }

            // Sunset: sunset -> dusk
            else if (now > sunset && now <= dusk) {
              const progress = (now - sunset) / (dusk - sunset);
              const transition = progress * progress * (3 - 2 * progress);

              targetStarsVisibility = transition;
              targetDayVisibility = 1 - transition;
            }

            // Sun movement
            if (now >= dawn && now <= dusk) {
              sunProgress = Math.max(0, Math.min(1,
                (now - dawn) / (dusk - dawn)
              ));
            }

            // Night rotation: dusk -> next dawn
            const nextDawn = new Date(dawn);
            nextDawn.setDate(nextDawn.getDate() + 1);

            if (now >= dusk) {
              nightProgress = (now - dusk) / (nextDawn - dusk);
            } else if (now <= dawn) {
              const previousDusk = new Date(dusk);
              previousDusk.setDate(previousDusk.getDate() - 1);

              nightProgress =
                (now - previousDusk) / (dawn - previousDusk);
            }

            nightProgress = Math.max(0, Math.min(1, nightProgress));

            // Target sun position
            const startX = -viewWidth / 2 - sunHalfWidth * 1.1;
            const endX = viewWidth / 2 + sunHalfWidth;

            const targetSunX = startX + (endX - startX) * sunProgress;

            const targetSunY =
              -viewHeight * 0.25 +
              Math.sin(sunProgress * Math.PI) * viewHeight * 0.55;

            // Initialise or smoothly update sky state
            if (!skyState) {
              skyState = {
                starsVisibility: targetStarsVisibility,
                dayVisibility: targetDayVisibility,
                sunProgress,
                nightProgress,
              };
            } else {
              const smoothing = 1 - Math.exp(-delta * 2.5);

              skyState.starsVisibility = THREE.MathUtils.lerp(
                skyState.starsVisibility,
                targetStarsVisibility,
                smoothing
              );

              skyState.dayVisibility = THREE.MathUtils.lerp(
                skyState.dayVisibility,
                targetDayVisibility,
                smoothing
              );

              skyState.sunProgress = THREE.MathUtils.lerp(
                skyState.sunProgress,
                sunProgress,
                smoothing
              );

              skyState.nightProgress = THREE.MathUtils.lerp(
                skyState.nightProgress,
                nightProgress,
                smoothing
              );
            }

            skyGroup.rotation.z = -Math.PI * skyState.nightProgress;


            const currentSunProgress = skyState.sunProgress;

            sunGroup.position.x =
              startX + (endX - startX) * currentSunProgress;

            sunGroup.position.y =
              -viewHeight * 0.25 +
              Math.sin(currentSunProgress * Math.PI) * viewHeight * 0.55;


            const starsVisibility = skyState.starsVisibility;
            const dayVisibility = skyState.dayVisibility;


            // Background
            const backgroundColor = dayColor.clone().lerp(nightColor, starsVisibility);

            mountRef.current.style.backgroundColor =
              `#${backgroundColor.getHexString()}`;

            // Scale night stars
            for (let i = 0; i < particleCount; i++) {
              sizes[i] = originalSizes[i] * starsVisibility;
            }

            geometry.attributes.size.needsUpdate = true;

            // Scale ambient day dots
            for (let i = 0; i < ambientDotCount; i++) {
              ambientSizes[i] = ambientOriginalSizes[i] * dayVisibility;
            }

            ambientGeometry.attributes.size.needsUpdate = true;

            // Scale sun dots
            for (let i = 0; i < sunDotCount; i++) {
              sunSizes[i] = sunOriginalSizes[i] * dayVisibility;
            }

            sunGeometry.attributes.size.needsUpdate = true;

        
            renderer.render(scene, camera);
        });

    };
      
    loadSvg();


    // Cleanup
    return () => {
        disposed = true;

        resizeObserver?.disconnect();
        
        renderer.setAnimationLoop(null);
        renderer.dispose();
        renderer.domElement.remove();
    };


  }, []);

  return (
    <div
      ref={mountRef}
      className={styles.canvas}
    />
  );
}

export default SkyCanvas;
