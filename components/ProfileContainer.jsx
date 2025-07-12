"use client";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Matter from "matter-js";
import Modal from "./Modal";

/**
 * ProfileContainer Component
 * 
 * A high-performance physics-based GitHub profile animation component that automatically
 * triggers on scroll. Uses Matter.js for realistic physics simulation of profile
 * elements that react to user interaction and scroll events.
 * 
 * Features:
 * - Automatic scroll-based triggering
 * - Optimized animation loop with 60 FPS cap
 * - Throttled scroll event handling
 * - Responsive design with resize handling
 * - Memoized configurations for better performance
 * - GitHub profile management with modal interface
 */
const ProfileContainer = ({
  backgroundColor = "transparent",
  wireframes = false,
  gravity = 1,
  mouseConstraintStiffness = 0.2,
}) => {
  const containerRef = useRef(null);
  const profilesRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const [effectStarted, setEffectStarted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([
    {
      id: 1,
      name: "Linus Torvalds",
      profileUrl: "https://github.com/torvalds",
      avatarUrl: "https://github.com/torvalds.png",
    },
    {
      id: 2,
      name: "Dan Abramov",
      profileUrl: "https://github.com/gaearon",
      avatarUrl: "https://github.com/gaearon.png",
    },
    {
      id: 3,
      name: "Evan You",
      profileUrl: "https://github.com/yyx990803",
      avatarUrl: "https://github.com/yyx990803.png",
    },
  ]);
  const [formData, setFormData] = useState({
    name: "",
    profileUrl: "",
    avatarUrl: "",
  });

  // Handle form submission to add a new profile
  const handleAddProfile = useCallback((e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.profileUrl.trim()) {
      return;
    }

    // Auto-generate avatar URL if not provided
    let avatarUrl = formData.avatarUrl.trim();
    if (!avatarUrl && formData.profileUrl.includes("github.com/")) {
      const username = formData.profileUrl.split("github.com/")[1]?.split("/")[0];
      if (username) {
        avatarUrl = `https://github.com/${username}.png`;
      }
    }

    const newProfile = {
      id: Date.now(),
      name: formData.name.trim(),
      profileUrl: formData.profileUrl.trim(),
      avatarUrl: avatarUrl || "https://github.com/github.png",
    };

    setProfiles(prevProfiles => [...prevProfiles, newProfile]);
    setFormData({ name: "", profileUrl: "", avatarUrl: "" });
    setIsModalOpen(false);
  }, [formData]);

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-generate avatar URL from profile URL
      if (field === "profileUrl" && value.includes("github.com/")) {
        const username = value.split("github.com/")[1]?.split("/")[0];
        if (username) {
          newData.avatarUrl = `https://github.com/${username}.png`;
        }
      }
      
      return newData;
    });
  }, []);

  // Handle removing a profile
  const handleRemoveProfile = useCallback((profileId) => {
    setProfiles(prevProfiles => prevProfiles.filter(profile => profile.id !== profileId));
  }, []);

  // Memoize the profile elements generation for better performance
  const renderProfiles = useCallback(() => {
    if (!profilesRef.current) return;
    
    profilesRef.current.innerHTML = "";
    
    profiles.forEach(profile => {
      const profileDiv = document.createElement("div");
      profileDiv.className = "inline-block mx-2 my-2 select-none profile-item";
      profileDiv.setAttribute("data-profile-id", profile.id);
      
      profileDiv.innerHTML = `
        <div class="flex items-center gap-3">
          <img
            src="${profile.avatarUrl}"
            alt="${profile.name}"
            class="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
            onerror="this.src='https://github.com/github.png'"
          />
          <div class="flex flex-col flex-1">
            <span class="text-white font-semibold">${profile.name}</span>
            
          </div>
          <button
            class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-400 hover:text-red-300 p-1 rounded"
            onclick="event.stopPropagation(); window.removeProfile(${profile.id})"
            title="Remove profile"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      `;
      
      profilesRef.current.appendChild(profileDiv);
    });
  }, [profiles]);

  useEffect(() => {
    renderProfiles();
    
    // Set up global remove function
    window.removeProfile = handleRemoveProfile;
    
    // Cleanup on unmount
    return () => {
      if (window.removeProfile) {
        delete window.removeProfile;
      }
    };
  }, [renderProfiles, handleRemoveProfile]);

  // Throttled scroll handler for performance
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isInViewport) {
      setEffectStarted(true);
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to detect when scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    }
  }, []);

  // Throttled scroll event listener
  useEffect(() => {
    let ticking = false;
    
    const throttledScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScrollHandler, { passive: true });
    // Check initial position
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", throttledScrollHandler);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Memoize Matter.js configuration for better performance
  const matterConfig = useMemo(() => ({
    boundaryOptions: {
      isStatic: true,
      render: { fillStyle: "transparent" },
    },
    bodyOptions: {
      render: { fillStyle: "transparent" },
      restitution: 0.4, // Reduced from 0.6 for even less bouncing
      frictionAir: 0.05, // Increased from 0.02 for more air resistance
      friction: 0.5, // Increased from 0.3 for more friction
      density: 0.001, // Added density for more realistic physics
    },
    runnerOptions: {
      delta: 16.666, // 60 FPS cap
      isFixed: true,
    },
  }), []);

  // Handle window resize for better responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (effectStarted && containerRef.current) {
        // Reset effect on resize to recalculate dimensions
        setEffectStarted(false);
        setTimeout(() => setEffectStarted(true), 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [effectStarted]);

  useEffect(() => {
    if (!effectStarted) return;

    const {
      Engine,
      Render,
      World,
      Bodies,
      Runner,
      Mouse,
      MouseConstraint,
    } = Matter;

    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    if (width <= 0 || height <= 0) return;

    // Create engine with optimized settings
    const engine = Engine.create();
    engine.world.gravity.y = gravity;
    engine.timing.timeScale = 1;
    engineRef.current = engine;

    // Create renderer with optimized settings
    const render = Render.create({
      element: canvasContainerRef.current,
      engine,
      options: {
        width,
        height,
        background: backgroundColor,
        wireframes,
        pixelRatio: Math.min(window.devicePixelRatio, 2), // Limit pixel ratio for performance
        hasBounds: true,
      },
    });
    renderRef.current = render;

    const boundaryOptions = {
      ...matterConfig.boundaryOptions,
      collisionFilter: {
        category: 0x0002, // Different category for boundaries
        mask: 0x0001, // Can collide with profile bodies
      },
    };
    const floor = Bodies.rectangle(
      width / 2,
      height - 25, // Move floor up to be within the container
      width,
      50,
      boundaryOptions
    );
    const leftWall = Bodies.rectangle(
      25, // Move left wall to be within the container
      height / 2,
      50,
      height,
      boundaryOptions
    );
    const rightWall = Bodies.rectangle(
      width - 25, // Move right wall to be within the container
      height / 2,
      50,
      height,
      boundaryOptions
    );
    const ceiling = Bodies.rectangle(
      width / 2,
      25, // Move ceiling down to be within the container
      width,
      50,
      boundaryOptions
    );

    const wordSpans = profilesRef.current.querySelectorAll(".profile-item");
    const wordBodies = [...wordSpans].map((elem) => {
      const rect = elem.getBoundingClientRect();

      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        ...matterConfig.bodyOptions,
        collisionFilter: {
          category: 0x0001, // Category for profile bodies
          mask: 0x0001 | 0x0002, // Can collide with other profile bodies AND boundaries
        },
      });
      
      // Add minimal initial velocity based on scroll state
      const velocityMultiplier = isScrolling ? 1.5 : 1; // Reduced from 3/2 to 1.5/1
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * velocityMultiplier,
        y: isScrolling ? (Math.random() - 0.5) * 0.5 : 0, // Reduced from 1 to 0.5
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02); // Reduced from 0.05 to 0.02

      return { elem, body };
    });

    // Set initial positions
    wordBodies.forEach(({ elem, body }) => {
      elem.style.position = "absolute";
      elem.style.left = `${body.position.x}px`;
      elem.style.top = `${body.position.y}px`;
      elem.style.transform = "translate(-50%, -50%)";
      elem.style.zIndex = "10"; // Ensure profiles are above canvas
    });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: mouseConstraintStiffness,
        render: { visible: false },
        angularStiffness: 0, // Prevent rotation when dragging
        length: 0.01, // Small length for better control
      },
    });
    render.mouse = mouse;

    // Improve mouse constraint detection
    mouseConstraint.collisionFilter.mask = 0x0001;

    // Add mouse event handling to profile elements
    wordBodies.forEach(({ elem, body }) => {
      // Store reference to body in element for mouse constraint
      elem.matterBody = body;
      
      // Make elements draggable by setting pointer events
      elem.style.pointerEvents = 'auto';
      elem.style.cursor = 'grab';
      
      // Add mouse event listeners for better interaction
      elem.addEventListener('mousedown', (e) => {
        elem.style.cursor = 'grabbing';
        e.stopPropagation();
      });
      
      elem.addEventListener('mouseup', (e) => {
        elem.style.cursor = 'grab';
        e.stopPropagation();
      });
      
      elem.addEventListener('mouseleave', (e) => {
        elem.style.cursor = 'grab';
      });
    });

    World.add(engine.world, [
      floor,
      leftWall,
      rightWall,
      ceiling,
      mouseConstraint,
      ...wordBodies.map((wb) => wb.body),
    ]);

    const runner = Runner.create(matterConfig.runnerOptions);
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    // Optimized update loop with performance monitoring
    let lastTime = 0;
    const updateLoop = (currentTime) => {
      // Skip frame if too soon (60 FPS cap)
      if (currentTime - lastTime < 16.666) {
        animationFrameRef.current = requestAnimationFrame(updateLoop);
        return;
      }
      
      lastTime = currentTime;

      // Batch DOM updates
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        
        // Keep bodies within bounds
        if (x < 50 || x > width - 50 || y < 50 || y > height - 50) {
          // Gently push back into bounds
          const centerX = width / 2;
          const centerY = height / 2;
          const forceToCenter = 0.001;
          
          Matter.Body.applyForce(body, body.position, {
            x: (centerX - x) * forceToCenter,
            y: (centerY - y) * forceToCenter,
          });
        }
        
        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });

      // Apply additional forces when scrolling (minimal intensity)
      if (isScrolling) {
        wordBodies.forEach(({ body }) => {
          // Add minimal turbulence when scrolling (reduced from 0.05 to 0.02)
          if (Math.random() < 0.02) {
            Matter.Body.applyForce(body, body.position, {
              x: (Math.random() - 0.5) * 0.0002, // Reduced from 0.0005
              y: (Math.random() - 0.5) * 0.0002, // Reduced from 0.0005
            });
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      // Cleanup mouse event listeners
      wordBodies.forEach(({ elem }) => {
        elem.removeEventListener('mousedown', () => {});
        elem.removeEventListener('mouseup', () => {});
        elem.removeEventListener('mouseleave', () => {});
      });
      
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderRef.current) {
        Render.stop(renderRef.current);
      }
      if (runnerRef.current) {
        Runner.stop(runnerRef.current);
      }
      if (render.canvas && canvasContainerRef.current) {
        canvasContainerRef.current.removeChild(render.canvas);
      }
      World.clear(engine.world);
      Engine.clear(engine);
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
    };
  }, [
    effectStarted,
    isScrolling,
    gravity,
    wireframes,
    backgroundColor,
    mouseConstraintStiffness,
    matterConfig,
    profiles,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle window resize for better responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (effectStarted && containerRef.current) {
        // Reset effect on resize to recalculate dimensions
        setEffectStarted(false);
        setTimeout(() => setEffectStarted(true), 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [effectStarted]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative z-[1] w-full h-full text-center pt-8 overflow-hidden"
      >
        {/* Add Profile Button */}
        <div className="mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 relative z-10 cursor-pointer"
          >
            Add Your Profile
          </button>
        </div>

        {/* Profiles Container */}
        <div
          ref={profilesRef}
          className="block min-h-[800px]"
        />
        
        {/* Show message when no profiles */}
        {profiles.length === 0 && (
          <div className="text-gray-400 text-center py-8">
            <p className="text-lg">No profiles added yet!</p>
            <p className="text-sm mt-2">Click "Add Your Profile" to get started</p>
          </div>
        )}

        {/* Canvas Container for Physics */}
        <div className="absolute top-0 left-0 z-0" ref={canvasContainerRef} />
      </div>

      {/* Modal for Adding Profile */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Add Your GitHub Profile
          </h2>
          
          <form onSubmit={handleAddProfile} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Profile Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label htmlFor="profileUrl" className="block text-sm font-medium text-gray-300 mb-2">
                GitHub Profile URL
              </label>
              <input
                type="url"
                id="profileUrl"
                value={formData.profileUrl}
                onChange={(e) => handleInputChange("profileUrl", e.target.value)}
                placeholder="https://github.com/yourusername"
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300 mb-2">
                Profile Photo URL
              </label>
              <input
                type="url"
                id="avatarUrl"
                value={formData.avatarUrl}
                onChange={(e) => handleInputChange("avatarUrl", e.target.value)}
                placeholder="Auto-generated from profile URL"
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave empty to auto-generate from GitHub profile URL
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Add Profile
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default ProfileContainer;
